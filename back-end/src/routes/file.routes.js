// routes/file.routes.js
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import crypto from 'crypto';
import FileAttachment from '../models/FileAttachment.js';
import Proposal from '../models/Proposal.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse
} from '../utils/response.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Configuração do Multer para upload em memória
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de ficheiro não permitido'), false);
    }
  },
});

// Middleware para obter GridFS bucket
const getGridFSBucket = (req, res, next) => {
  const db = mongoose.connection.db;
  req.gridFSBucket = new GridFSBucket(db, { bucketName: 'uploads' });
  next();
};

// Todas as rotas requerem autenticação e GridFS
router.use(authenticate);
router.use(getGridFSBucket);

/**
 * @route   POST /api/files/upload
 * @desc    Upload de ficheiro para uma proposta
 * @access  Private
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Nenhum ficheiro enviado', 400);
    }

    const { proposal_id, category, description, tags, access_level, is_public } = req.body;

    // Validações
    if (!proposal_id) {
      return errorResponse(res, 'ID da proposta é obrigatório', 400);
    }

    // Verificar se a proposta existe
    const proposal = await Proposal.findById(proposal_id);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar permissões
    const isOwner = proposal.advisor_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';
    const isCoadvisor = await ProposalCoadvisor.exists({
      proposal_id,
      coadvisor_id: req.user._id,
      status: 'accepted',
    });

    if (!isOwner && !isAdmin && !isCoadvisor && req.user.type !== 'STUDENT') {
      return forbiddenResponse(res, 'Não tem permissão para fazer upload para esta proposta');
    }

    // Gerar hash do ficheiro
    const md5Hash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
    const sha256Hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Upload para GridFS
    const uploadStream = req.gridFSBucket.openUploadStream(req.file.originalname, {
      metadata: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        uploadedBy: req.user._id,
        proposalId: proposal_id,
        md5Hash,
        sha256Hash,
      },
    });

    // Promise wrapper para o stream
    const gridFSFile = await new Promise((resolve, reject) => {
      uploadStream.write(req.file.buffer);
      uploadStream.end();

      uploadStream.on('finish', (file) => {
        resolve(file);
      });

      uploadStream.on('error', (error) => {
        reject(error);
      });
    });

    // Criar registo no FileAttachment
    const fileAttachment = await FileAttachment.create({
      filename: gridFSFile.filename,
      original_filename: req.file.originalname,
      file_size_bytes: gridFSFile.length,
      mime_type: req.file.mimetype,
      gridfs_file_id: gridFSFile._id,
      proposal_id,
      user_id: req.user._id,
      category: category || 'proposal_document',
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      access_level: access_level || 'private',
      is_public: is_public === 'true',
      md5_hash: md5Hash,
      sha256_hash: sha256Hash,
      upload_ip: req.ip,
      upload_user_agent: req.get('User-Agent'),
    });

    // Populate para resposta
    await fileAttachment.populate('uploader', 'full_name email');

    return successResponse(
      res, 
      { file: fileAttachment }, 
      'Ficheiro enviado com sucesso', 
      201
    );

  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.message === 'Tipo de ficheiro não permitido') {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, 'Erro ao fazer upload do ficheiro', 500);
  }
});

/**
 * @route   GET /api/files/proposal/:proposalId
 * @desc    Listar ficheiros de uma proposta
 * @access  Private
 */
router.get('/proposal/:proposalId', async (req, res) => {
  try {
    const proposalId = req.params.proposalId;

    // Verificar se a proposta existe
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Construir query baseada nas permissões
    const query = { proposal_id: proposalId, deleted_at: null };

    // Filtrar por acesso
    if (req.user.type === 'STUDENT') {
      query.$or = [
        { is_public: true },
        { access_level: 'public' },
        { access_level: 'students' },
        { allowed_users: req.user._id },
      ];
    } else if (req.user.type === 'FACULTY') {
      const isOwner = proposal.advisor_id.toString() === req.user._id.toString();
      const isCoadvisor = await ProposalCoadvisor.exists({
        proposal_id: proposalId,
        coadvisor_id: req.user._id,
        status: 'accepted',
      });

      if (!isOwner && !isCoadvisor) {
        query.$or = [
          { is_public: true },
          { access_level: 'public' },
          { access_level: 'faculty' },
          { allowed_users: req.user._id },
          { user_id: req.user._id },
        ];
      }
    }

    const files = await FileAttachment.find(query)
      .populate('uploader', 'full_name email')
      .sort({ uploaded_at: -1 });

    return successResponse(res, { files }, 'Ficheiros listados com sucesso');

  } catch (error) {
    console.error('List files error:', error);
    return errorResponse(res, 'Erro ao listar ficheiros', 500);
  }
});

/**
 * @route   GET /api/files/:id
 * @desc    Obter detalhes de um ficheiro
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await FileAttachment.findById(fileId)
      .populate('uploader', 'full_name email')
      .populate('proposal', 'title');

    if (!file) {
      return notFoundResponse(res, 'Ficheiro');
    }

    if (file.is_deleted) {
      return errorResponse(res, 'Ficheiro foi eliminado', 404);
    }

    // Verificar permissões de acesso
    if (!file.hasAccess(req.user)) {
      return forbiddenResponse(res, 'Não tem permissão para aceder a este ficheiro');
    }

    return successResponse(res, { file }, 'Ficheiro obtido com sucesso');

  } catch (error) {
    console.error('Get file error:', error);
    return errorResponse(res, 'Erro ao obter ficheiro', 500);
  }
});

/**
 * @route   GET /api/files/:id/download
 * @desc    Download de um ficheiro
 * @access  Private
 */
router.get('/:id/download', async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await FileAttachment.findById(fileId);

    if (!file) {
      return notFoundResponse(res, 'Ficheiro');
    }

    if (file.is_deleted) {
      return errorResponse(res, 'Ficheiro foi eliminado', 404);
    }

    // Verificar permissões de acesso
    if (!file.hasAccess(req.user)) {
      return forbiddenResponse(res, 'Não tem permissão para descarregar este ficheiro');
    }

    // Incrementar contador de downloads
    await file.incrementDownloadCount();

    // Configurar headers de resposta
    res.set({
      'Content-Type': file.mime_type,
      'Content-Disposition': `attachment; filename="${file.original_filename}"`,
      'Content-Length': file.file_size_bytes,
    });

    // Stream do GridFS
    const downloadStream = req.gridFSBucket.openDownloadStream(file.gridfs_file_id);
    
    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      if (!res.headersSent) {
        return errorResponse(res, 'Erro ao descarregar ficheiro', 500);
      }
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    if (!res.headersSent) {
      return errorResponse(res, 'Erro ao descarregar ficheiro', 500);
    }
  }
});

/**
 * @route   PUT /api/files/:id
 * @desc    Atualizar metadados de um ficheiro
 * @access  Private (Owner ou Admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const updates = req.body;

    const file = await FileAttachment.findById(fileId);

    if (!file) {
      return notFoundResponse(res, 'Ficheiro');
    }

    // Verificar permissões
    const isOwner = file.user_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return forbiddenResponse(res, 'Não tem permissão para atualizar este ficheiro');
    }

    // Campos permitidos para atualização
    const allowedUpdates = ['description', 'tags', 'access_level', 'is_public', 'allowed_users'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'tags' && typeof updates[key] === 'string') {
          filteredUpdates[key] = updates[key].split(',').map(tag => tag.trim());
        } else if (key === 'allowed_users' && typeof updates[key] === 'string') {
          filteredUpdates[key] = updates[key].split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
        } else {
          filteredUpdates[key] = updates[key];
        }
      }
    });

    // Atualizar
    Object.keys(filteredUpdates).forEach(key => {
      file[key] = filteredUpdates[key];
    });

    await file.save();

    return successResponse(res, { file }, 'Ficheiro atualizado com sucesso');

  } catch (error) {
    console.error('Update file error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao atualizar ficheiro', 500);
  }
});

/**
 * @route   DELETE /api/files/:id
 * @desc    Eliminar ficheiro (soft delete)
 * @access  Private (Owner ou Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await FileAttachment.findById(fileId);

    if (!file) {
      return notFoundResponse(res, 'Ficheiro');
    }

    // Verificar permissões
    const isOwner = file.user_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return forbiddenResponse(res, 'Não tem permissão para eliminar este ficheiro');
    }

    // Soft delete
    await file.softDelete(req.user._id);

    return successResponse(res, null, 'Ficheiro eliminado com sucesso');

  } catch (error) {
    console.error('Delete file error:', error);
    return errorResponse(res, 'Erro ao eliminar ficheiro', 500);
  }
});

/**
 * @route   GET /api/files/stats
 * @desc    Obter estatísticas de ficheiros
 * @access  Private (Admin)
 */
router.get('/stats', authorize('ADMIN'), async (req, res) => {
  try {
    const stats = await FileAttachment.getStorageStats();

    return successResponse(res, { stats }, 'Estatísticas obtidas com sucesso');

  } catch (error) {
    console.error('Get files stats error:', error);
    return errorResponse(res, 'Erro ao obter estatísticas', 500);
  }
});

export default router;
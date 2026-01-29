// routes/proposal.routes.js
import express from 'express';
import mongoose from 'mongoose';
import Proposal from '../models/Proposal.js';
import ProposalCoadvisor from '../models/ProposalCoadvisor.js';
import ProposalStudent from '../models/ProposalStudent.js';
import User from '../models/User.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse
} from '../utils/response.js';
import { authenticate, authorize, hasPermission } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   GET /api/proposals
 * @desc    Listar propostas com filtros
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      academic_year, 
      department, 
      advisor,
      search,
      my_proposals = 'false',
      page = 1, 
      limit = 20 
    } = req.query;

    // Construir query
    const query = {};

    // Filtros básicos
    if (status) query.status = status;
    if (academic_year) query.academic_year = academic_year;
    if (department) query.department = department;
    if (advisor) query.advisor_id = new mongoose.Types.ObjectId(advisor);

    // Busca por título ou descrição
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Filtrar apenas minhas propostas (para docentes)
    if (my_proposals === 'true' && req.user.type === 'FACULTY') {
      query.advisor_id = req.user._id;
    }

    // Alunos só veem propostas aprovadas
    if (req.user.type === 'STUDENT') {
      query.status = 'approved';
    }

    // Paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Pipeline de agregação para dados relacionados
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'advisor_id',
          foreignField: '_id',
          as: 'advisor',
        },
      },
      { $unwind: { path: '$advisor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          description: 1,
          objectives: 1,
          keywords: 1,
          status: 1,
          academic_year: 1,
          department: 1,
          created_at: 1,
          submitted_at: 1,
          approved_at: 1,
          'advisor.full_name': 1,
          'advisor.email': 1,
          'advisor.department': 1,
        },
      },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ];

    // Executar queries em paralelo
    const [proposals, total] = await Promise.all([
      Proposal.aggregate(pipeline),
      Proposal.countDocuments(query),
    ]);

    // Estatísticas
    const stats = await Proposal.countByStatus();

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      proposals,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      stats,
    }, 'Propostas listadas com sucesso');

  } catch (error) {
    console.error('List proposals error:', error);
    return errorResponse(res, 'Erro ao listar propostas', 500);
  }
});

/**
 * @route   GET /api/proposals/available
 * @desc    Listar propostas disponíveis para alunos
 * @access  Private (Students)
 */
router.get('/available', authorize('STUDENT'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Buscar propostas aprovadas
    const query = { status: 'approved' };

    // Verificar se o aluno já se candidatou
    const studentApplications = await ProposalStudent.find({
      student_id: req.user._id,
    }).select('proposal_id');

    const appliedProposalIds = studentApplications.map(app => app.proposal_id);

    if (appliedProposalIds.length > 0) {
      query._id = { $nin: appliedProposalIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('advisor', 'full_name email department')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Proposal.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      proposals,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    }, 'Propostas disponíveis listadas com sucesso');

  } catch (error) {
    console.error('List available proposals error:', error);
    return errorResponse(res, 'Erro ao listar propostas disponíveis', 500);
  }
});

/**
 * @route   POST /api/proposals
 * @desc    Criar nova proposta
 * @access  Private (Faculty)
 */
router.post('/', authorize('FACULTY'), hasPermission('proposals:create'), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      objectives, 
      keywords,
      academic_year 
    } = req.body;

    // Validações básicas
    if (!title || !description || !objectives || !keywords) {
      return errorResponse(res, 'Campos obrigatórios em falta', 400);
    }

    // Validar arrays
    if (!Array.isArray(objectives) || objectives.length === 0) {
      return errorResponse(res, 'Deve definir pelo menos um objetivo', 400);
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return errorResponse(res, 'Deve definir pelo menos uma palavra-chave', 400);
    }

    // Criar proposta
    const proposal = await Proposal.create({
      title,
      description,
      objectives,
      keywords,
      advisor_id: req.user._id,
      academic_year: academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      department: req.user.department,
      status: 'draft',
      created_by: req.user._id,
    });

    return successResponse(
      res, 
      { proposal }, 
      'Proposta criada com sucesso', 
      201
    );

  } catch (error) {
    console.error('Create proposal error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao criar proposta', 500);
  }
});

/**
 * @route   GET /api/proposals/:id
 * @desc    Obter detalhes de uma proposta
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const proposalId = req.params.id;

    const proposal = await Proposal.findById(proposalId)
      .populate('advisor', 'full_name email department employee_number')
      .populate('created_by', 'full_name email');

    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar permissões de visualização
    if (req.user.type === 'STUDENT' && proposal.status !== 'approved') {
      return forbiddenResponse(res, 'Não tem permissão para ver esta proposta');
    }

    // Incrementar contador de visualizações
    await proposal.incrementViews();

    // Buscar informações relacionadas
    const [coadvisors, students] = await Promise.all([
      ProposalCoadvisor.find({ proposal_id: proposalId, status: 'accepted' })
        .populate('coadvisor', 'full_name email department'),
      ProposalStudent.find({ proposal_id: proposalId, application_status: 'accepted' })
        .populate('student', 'full_name email student_number'),
    ]);

    const response = {
      proposal: proposal.toObject(),
      coadvisors,
      assigned_students: students,
    };

    return successResponse(res, response, 'Proposta obtida com sucesso');

  } catch (error) {
    console.error('Get proposal error:', error);
    return errorResponse(res, 'Erro ao obter proposta', 500);
  }
});

/**
 * @route   PUT /api/proposals/:id
 * @desc    Atualizar proposta
 * @access  Private (Owner ou Admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const proposalId = req.params.id;
    const updates = req.body;

    // Buscar proposta
    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar permissões
    const isOwner = proposal.advisor_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return forbiddenResponse(res, 'Não tem permissão para atualizar esta proposta');
    }

    // Verificar se a proposta pode ser editada
    if (!proposal.isEditable() && !isAdmin) {
      return forbiddenResponse(res, 'Esta proposta não pode ser editada no estado atual');
    }

    // Campos que não podem ser atualizados diretamente
    delete updates.advisor_id;
    delete updates.status;
    delete updates.created_by;
    delete updates.created_at;

    // Atualizar
    Object.keys(updates).forEach(key => {
      proposal[key] = updates[key];
    });

    proposal.updated_by = req.user._id;
    await proposal.save();

    return successResponse(res, { proposal }, 'Proposta atualizada com sucesso');

  } catch (error) {
    console.error('Update proposal error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao atualizar proposta', 500);
  }
});

/**
 * @route   POST /api/proposals/:id/submit
 * @desc    Submeter proposta para revisão
 * @access  Private (Owner)
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const proposalId = req.params.id;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar se é o dono
    if (proposal.advisor_id.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Apenas o orientador pode submeter a proposta');
    }

    // Verificar se pode ser submetida
    if (proposal.status !== 'draft') {
      return errorResponse(res, 'Apenas propostas em rascunho podem ser submetidas', 400);
    }

    // Validar dados mínimos
    if (!proposal.title || !proposal.description || !proposal.objectives?.length || !proposal.keywords?.length) {
      return errorResponse(res, 'Complete todos os campos obrigatórios antes de submeter', 400);
    }

    await proposal.submit();

    return successResponse(res, { proposal }, 'Proposta submetida com sucesso');

  } catch (error) {
    console.error('Submit proposal error:', error);
    return errorResponse(res, 'Erro ao submeter proposta', 500);
  }
});

/**
 * @route   POST /api/proposals/:id/approve
 * @desc    Aprovar proposta
 * @access  Private (Admin)
 */
router.post('/:id/approve', authorize('ADMIN'), hasPermission('proposals:approve'), async (req, res) => {
  try {
    const proposalId = req.params.id;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    if (proposal.status !== 'submitted' && proposal.status !== 'under_review') {
      return errorResponse(res, 'Apenas propostas submetidas podem ser aprovadas', 400);
    }

    await proposal.approve();

    return successResponse(res, { proposal }, 'Proposta aprovada com sucesso');

  } catch (error) {
    console.error('Approve proposal error:', error);
    return errorResponse(res, 'Erro ao aprovar proposta', 500);
  }
});

/**
 * @route   POST /api/proposals/:id/reject
 * @desc    Rejeitar proposta
 * @access  Private (Admin)
 */
router.post('/:id/reject', authorize('ADMIN'), hasPermission('proposals:approve'), async (req, res) => {
  try {
    const proposalId = req.params.id;
    const { reason } = req.body;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    if (proposal.status !== 'submitted' && proposal.status !== 'under_review') {
      return errorResponse(res, 'Apenas propostas submetidas podem ser rejeitadas', 400);
    }

    proposal.status = 'rejected';
    await proposal.save();

    // Aqui você poderia enviar notificação ao orientador

    return successResponse(res, { proposal }, 'Proposta rejeitada com sucesso');

  } catch (error) {
    console.error('Reject proposal error:', error);
    return errorResponse(res, 'Erro ao rejeitar proposta', 500);
  }
});

/**
 * @route   DELETE /api/proposals/:id
 * @desc    Eliminar proposta (apenas rascunhos)
 * @access  Private (Owner ou Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const proposalId = req.params.id;

    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar permissões
    const isOwner = proposal.advisor_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return forbiddenResponse(res, 'Não tem permissão para eliminar esta proposta');
    }

    // Apenas rascunhos ou rejeitadas podem ser eliminadas
    if (!['draft', 'rejected'].includes(proposal.status) && !isAdmin) {
      return errorResponse(res, 'Apenas propostas em rascunho ou rejeitadas podem ser eliminadas', 400);
    }

    // Eliminar relacionados primeiro
    await Promise.all([
      ProposalCoadvisor.deleteMany({ proposal_id: proposalId }),
      ProposalStudent.deleteMany({ proposal_id: proposalId }),
    ]);

    await proposal.deleteOne();

    return successResponse(res, null, 'Proposta eliminada com sucesso');

  } catch (error) {
    console.error('Delete proposal error:', error);
    return errorResponse(res, 'Erro ao eliminar proposta', 500);
  }
});

/**
 * @route   GET /api/proposals/:id/coadvisors
 * @desc    Listar coorientadores de uma proposta
 * @access  Private
 */
router.get('/:id/coadvisors', async (req, res) => {
  try {
    const proposalId = req.params.id;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    const coadvisors = await ProposalCoadvisor.find({ proposal_id: proposalId })
      .populate('coadvisor', 'full_name email department');

    return successResponse(res, { coadvisors }, 'Coorientadores listados com sucesso');

  } catch (error) {
    console.error('List coadvisors error:', error);
    return errorResponse(res, 'Erro ao listar coorientadores', 500);
  }
});

/**
 * @route   GET /api/proposals/:id/students
 * @desc    Listar alunos de uma proposta
 * @access  Private
 */
router.get('/:id/students', async (req, res) => {
  try {
    const proposalId = req.params.id;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    const students = await ProposalStudent.find({ proposal_id: proposalId })
      .populate('student', 'full_name email student_number department');

    return successResponse(res, { students }, 'Alunos listados com sucesso');

  } catch (error) {
    console.error('List students error:', error);
    return errorResponse(res, 'Erro ao listar alunos', 500);
  }
});

export default router;
// routes/student.routes.js
import express from 'express';
import mongoose from 'mongoose';
import ProposalStudent from '../models/ProposalStudent.js';
import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse
} from '../utils/response.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   POST /api/students/apply
 * @desc    Candidatar-se a uma proposta
 * @access  Private (Students)
 */
router.post('/apply', authorize('STUDENT'), async (req, res) => {
  try {
    const { proposal_id, application_notes } = req.body;

    if (!proposal_id) {
      return errorResponse(res, 'ID da proposta é obrigatório', 400);
    }

    // Verificar se a proposta existe e está aprovada
    const proposal = await Proposal.findById(proposal_id);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    if (proposal.status !== 'approved') {
      return errorResponse(res, 'Apenas pode candidatar-se a propostas aprovadas', 400);
    }

    // Verificar se já se candidatou
    const existingApplication = await ProposalStudent.findOne({
      proposal_id,
      student_id: req.user._id,
    });

    if (existingApplication) {
      return conflictResponse(res, 'Já se candidatou a esta proposta');
    }

    // Verificar limite de candidaturas ativas (ex: máximo 3)
    const activeApplications = await ProposalStudent.countDocuments({
      student_id: req.user._id,
      application_status: { $in: ['applied', 'under_review', 'shortlisted'] },
    });

    if (activeApplications >= 3) {
      return errorResponse(res, 'Já tem 3 candidaturas ativas. Aguarde a resposta.', 400);
    }

    // Criar candidatura
    const application = await ProposalStudent.create({
      proposal_id,
      student_id: req.user._id,
      application_notes,
      context: {
        application_notes,
        priority: 1,
      },
      created_by: req.user._id,
    });

    // Incrementar contador de candidaturas na proposta
    await proposal.incrementApplications();

    // Populate para resposta
    await application.populate('proposal', 'title description advisor_id');

    // Aqui você poderia enviar notificação ao orientador

    return successResponse(
      res, 
      { application }, 
      'Candidatura submetida com sucesso', 
      201
    );

  } catch (error) {
    console.error('Apply to proposal error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao submeter candidatura', 500);
  }
});

/**
 * @route   GET /api/students/my-applications
 * @desc    Listar candidaturas do aluno atual
 * @access  Private (Students)
 */
router.get('/my-applications', authorize('STUDENT'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { student_id: req.user._id };
    if (status) query.application_status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [applications, total] = await Promise.all([
      ProposalStudent.find(query)
        .populate({
          path: 'proposal',
          populate: {
            path: 'advisor',
            select: 'full_name email department',
          },
        })
        .sort({ applied_at: -1 })
        .skip(skip)
        .limit(limitNum),
      ProposalStudent.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    }, 'Candidaturas listadas com sucesso');

  } catch (error) {
    console.error('List applications error:', error);
    return errorResponse(res, 'Erro ao listar candidaturas', 500);
  }
});

/**
 * @route   PUT /api/students/applications/:id/withdraw
 * @desc    Retirar candidatura
 * @access  Private (Student - Owner)
 */
router.put('/applications/:id/withdraw', authorize('STUDENT'), async (req, res) => {
  try {
    const applicationId = req.params.id;

    const application = await ProposalStudent.findById(applicationId)
      .populate('proposal', 'title status');

    if (!application) {
      return notFoundResponse(res, 'Candidatura');
    }

    // Verificar se é o dono da candidatura
    if (application.student_id.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Não tem permissão para retirar esta candidatura');
    }

    // Verificar se ainda pode ser retirada
    if (!['applied', 'under_review', 'shortlisted'].includes(application.application_status)) {
      return errorResponse(res, 'Esta candidatura já foi processada e não pode ser retirada', 400);
    }

    application.application_status = 'withdrawn';
    await application.save();

    return successResponse(res, { application }, 'Candidatura retirada com sucesso');

  } catch (error) {
    console.error('Withdraw application error:', error);
    return errorResponse(res, 'Erro ao retirar candidatura', 500);
  }
});

/**
 * @route   GET /api/students/:proposalId/applications
 * @desc    Listar candidaturas a uma proposta (apenas orientador/admin)
 * @access  Private (Proposal Owner ou Admin)
 */
router.get('/:proposalId/applications', async (req, res) => {
  try {
    const proposalId = req.params.proposalId;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar permissões
    const isOwner = proposal.advisor_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return forbiddenResponse(res, 'Não tem permissão para ver estas candidaturas');
    }

    const applications = await ProposalStudent.find({ proposal_id: proposalId })
      .populate('student', 'full_name email student_number department student_year student_semester')
      .sort({ applied_at: -1 });

    return successResponse(res, { applications }, 'Candidaturas listadas com sucesso');

  } catch (error) {
    console.error('List proposal applications error:', error);
    return errorResponse(res, 'Erro ao listar candidaturas', 500);
  }
});

/**
 * @route   PUT /api/students/applications/:id/accept
 * @desc    Aceitar candidatura de aluno (apenas orientador)
 * @access  Private (Proposal Owner)
 */
router.put('/applications/:id/accept', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { feedback } = req.body;

    const application = await ProposalStudent.findById(applicationId)
      .populate('proposal', 'title status advisor_id max_students')
      .populate('student', 'full_name email');

    if (!application) {
      return notFoundResponse(res, 'Candidatura');
    }

    // Verificar se é o orientador da proposta
    if (application.proposal.advisor_id.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Apenas o orientador pode aceitar candidaturas');
    }

    // Verificar se a proposta ainda está aprovada
    if (application.proposal.status !== 'approved') {
      return errorResponse(res, 'A proposta não está disponível para atribuição', 400);
    }

    // Verificar se já atingiu o limite máximo de alunos
    const acceptedCount = await ProposalStudent.countDocuments({
      proposal_id: application.proposal._id,
      application_status: 'accepted',
    });

    if (acceptedCount >= application.proposal.max_students) {
      return errorResponse(res, 'Atingiu o número máximo de alunos para esta proposta', 400);
    }

    // Aceitar candidatura
    await application.acceptApplication(feedback);

    // Se for a primeira aceitação, atualizar status da proposta
    if (acceptedCount === 0) {
      await application.proposal.assign();
    }

    // Aqui você poderia enviar notificação ao aluno

    return successResponse(res, { application }, 'Candidatura aceite com sucesso');

  } catch (error) {
    console.error('Accept application error:', error);
    return errorResponse(res, 'Erro ao aceitar candidatura', 500);
  }
});

/**
 * @route   PUT /api/students/applications/:id/reject
 * @desc    Rejeitar candidatura de aluno (apenas orientador)
 * @access  Private (Proposal Owner)
 */
router.put('/applications/:id/reject', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { feedback } = req.body;

    const application = await ProposalStudent.findById(applicationId)
      .populate('proposal', 'title status advisor_id');

    if (!application) {
      return notFoundResponse(res, 'Candidatura');
    }

    // Verificar se é o orientador da proposta
    if (application.proposal.advisor_id.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Apenas o orientador pode rejeitar candidaturas');
    }

    // Verificar se ainda pode ser rejeitada
    if (application.application_status !== 'applied' && application.application_status !== 'under_review') {
      return errorResponse(res, 'Esta candidatura já foi processada', 400);
    }

    // Rejeitar candidatura
    await application.rejectApplication(feedback);

    // Aqui você poderia enviar notificação ao aluno

    return successResponse(res, { application }, 'Candidatura rejeitada com sucesso');

  } catch (error) {
    console.error('Reject application error:', error);
    return errorResponse(res, 'Erro ao rejeitar candidatura', 500);
  }
});

/**
 * @route   GET /api/students/my-assignments
 * @desc    Listar projetos atribuídos ao aluno atual
 * @access  Private (Students)
 */
router.get('/my-assignments', authorize('STUDENT'), async (req, res) => {
  try {
    const assignments = await ProposalStudent.findActiveAssignments(req.user._id)
      .populate({
        path: 'proposal',
        populate: [
          {
            path: 'advisor',
            select: 'full_name email department',
          },
          {
            path: 'coadvisors',
            populate: {
              path: 'coadvisor',
              select: 'full_name email',
            },
          },
        ],
      });

    return successResponse(res, { assignments }, 'Projetos atribuídos listados com sucesso');

  } catch (error) {
    console.error('List assignments error:', error);
    return errorResponse(res, 'Erro ao listar projetos atribuídos', 500);
  }
});

export default router;
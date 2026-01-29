// routes/coadvisor.routes.js
import express from 'express';
import mongoose from 'mongoose';
import ProposalCoadvisor from '../models/ProposalCoadvisor.js';
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
 * @route   POST /api/coadvisors
 * @desc    Convidar coorientador para proposta
 * @access  Private (Proposal Owner)
 */
router.post('/', async (req, res) => {
  try {
    const { proposal_id, coadvisor_id, context } = req.body;

    if (!proposal_id || !coadvisor_id) {
      return errorResponse(res, 'ID da proposta e do coorientador são obrigatórios', 400);
    }

    // Verificar se a proposta existe
    const proposal = await Proposal.findById(proposal_id);
    if (!proposal) {
      return notFoundResponse(res, 'Proposta');
    }

    // Verificar se é o dono da proposta
    if (proposal.advisor_id.toString() !== req.user._id.toString() && req.user.type !== 'ADMIN') {
      return forbiddenResponse(res, 'Apenas o orientador pode convidar coorientadores');
    }

    // Verificar se o coorientador existe e é FACULTY
    const coadvisor = await User.findById(coadvisor_id);
    if (!coadvisor || coadvisor.type !== 'FACULTY') {
      return errorResponse(res, 'Coorientador inválido. Deve ser um docente.', 400);
    }

    // Verificar se não é o próprio orientador
    if (coadvisor_id === proposal.advisor_id.toString()) {
      return errorResponse(res, 'Não pode convidar-se a si mesmo como coorientador', 400);
    }

    // Verificar se já existe convite
    const existingInvitation = await ProposalCoadvisor.findOne({
      proposal_id,
      coadvisor_id,
    });

    if (existingInvitation) {
      return conflictResponse(res, 'Este docente já foi convidado para esta proposta');
    }

    // Criar convite
    const invitation = await ProposalCoadvisor.create({
      proposal_id,
      coadvisor_id,
      context,
      created_by: req.user._id,
    });

    // Populate para resposta
    await invitation.populate('coadvisor', 'full_name email department');

    // Aqui você poderia enviar notificação por email

    return successResponse(
      res, 
      { invitation }, 
      'Coorientador convidado com sucesso', 
      201
    );

  } catch (error) {
    console.error('Invite coadvisor error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao convidar coorientador', 500);
  }
});

/**
 * @route   GET /api/coadvisors/invitations
 * @desc    Listar convites recebidos pelo utilizador atual
 * @access  Private (Faculty)
 */
router.get('/invitations', authorize('FACULTY'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { coadvisor_id: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [invitations, total] = await Promise.all([
      ProposalCoadvisor.find(query)
        .populate('proposal', 'title description status advisor_id')
        .populate('created_by', 'full_name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      ProposalCoadvisor.countDocuments(query),
    ]);

    // Populate advisor dentro da proposta
    for (const invitation of invitations) {
      if (invitation.proposal?.advisor_id) {
        const advisor = await User.findById(invitation.proposal.advisor_id)
          .select('full_name email department');
        invitation.proposal.advisor = advisor;
      }
    }

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      invitations,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    }, 'Convites listados com sucesso');

  } catch (error) {
    console.error('List invitations error:', error);
    return errorResponse(res, 'Erro ao listar convites', 500);
  }
});

/**
 * @route   PUT /api/coadvisors/:id/accept
 * @desc    Aceitar convite de coorientação
 * @access  Private (Invited Faculty)
 */
router.put('/:id/accept', authorize('FACULTY'), async (req, res) => {
  try {
    const invitationId = req.params.id;
    const { response_message } = req.body;

    const invitation = await ProposalCoadvisor.findById(invitationId)
      .populate('proposal', 'title status');

    if (!invitation) {
      return notFoundResponse(res, 'Convite');
    }

    // Verificar se é o coorientador convidado
    if (invitation.coadvisor_id.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Não tem permissão para aceitar este convite');
    }

    // Verificar se o convite está pendente
    if (invitation.status !== 'pending') {
      return errorResponse(res, 'Este convite já foi respondido', 400);
    }

    // Aceitar convite
    await invitation.acceptInvitation(response_message);

    return successResponse(res, { invitation }, 'Convite aceite com sucesso');

  } catch (error) {
    console.error('Accept invitation error:', error);
    return errorResponse(res, 'Erro ao aceitar convite', 500);
  }
});

/**
 * @route   PUT /api/coadvisors/:id/reject
 * @desc    Rejeitar convite de coorientação
 * @access  Private (Invited Faculty)
 */
router.put('/:id/reject', authorize('FACULTY'), async (req, res) => {
  try {
    const invitationId = req.params.id;
    const { response_message } = req.body;

    const invitation = await ProposalCoadvisor.findById(invitationId)
      .populate('proposal', 'title status');

    if (!invitation) {
      return notFoundResponse(res, 'Convite');
    }

    // Verificar se é o coorientador convidado
    if (invitation.coadvisor_id.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Não tem permissão para rejeitar este convite');
    }

    // Verificar se o convite está pendente
    if (invitation.status !== 'pending') {
      return errorResponse(res, 'Este convite já foi respondido', 400);
    }

    // Rejeitar convite
    await invitation.rejectInvitation(response_message);

    return successResponse(res, { invitation }, 'Convite rejeitado com sucesso');

  } catch (error) {
    console.error('Reject invitation error:', error);
    return errorResponse(res, 'Erro ao rejeitar convite', 500);
  }
});

/**
 * @route   DELETE /api/coadvisors/:id
 * @desc    Remover coorientador de uma proposta
 * @access  Private (Proposal Owner ou Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const invitationId = req.params.id;

    const invitation = await ProposalCoadvisor.findById(invitationId)
      .populate('proposal', 'advisor_id status');

    if (!invitation) {
      return notFoundResponse(res, 'Convite');
    }

    // Verificar permissões
    const isProposalOwner = invitation.proposal.advisor_id.toString() === req.user._id.toString();
    const isAdmin = req.user.type === 'ADMIN';
    const isCoadvisor = invitation.coadvisor_id.toString() === req.user._id.toString();
    
    if (!isProposalOwner && !isAdmin && !isCoadvisor) {
      return forbiddenResponse(res, 'Não tem permissão para remover este coorientador');
    }

    // Coorientadores só podem remover-se a si mesmos
    if (isCoadvisor && !isProposalOwner && !isAdmin) {
      if (invitation.status === 'accepted') {
        await invitation.withdraw();
        return successResponse(res, null, 'Removido da coorientação com sucesso');
      }
    }

    // Dono ou Admin podem remover
    await invitation.deleteOne();

    return successResponse(res, null, 'Coorientador removido com sucesso');

  } catch (error) {
    console.error('Remove coadvisor error:', error);
    return errorResponse(res, 'Erro ao remover coorientador', 500);
  }
});

/**
 * @route   GET /api/coadvisors/my-coadvised
 * @desc    Listar propostas onde o utilizador é coorientador
 * @access  Private (Faculty)
 */
router.get('/my-coadvised', authorize('FACULTY'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {
      coadvisor_id: req.user._id,
      status: 'accepted',
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [invitations, total] = await Promise.all([
      ProposalCoadvisor.find(query)
        .populate({
          path: 'proposal',
          populate: {
            path: 'advisor',
            select: 'full_name email department',
          },
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      ProposalCoadvisor.countDocuments(query),
    ]);

    const proposals = invitations.map(inv => inv.proposal);

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
    }, 'Propostas coorientadas listadas com sucesso');

  } catch (error) {
    console.error('List coadvised error:', error);
    return errorResponse(res, 'Erro ao listar propostas coorientadas', 500);
  }
});

export default router;
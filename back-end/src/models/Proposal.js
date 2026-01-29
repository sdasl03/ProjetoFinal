// models/Proposal.js - VERSÃO CORRIGIDA (alinhada com PDF)
import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    // ========== INFORMAÇÕES BÁSICAS (do PDF) ==========
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
      minlength: [5, 'Título deve ter pelo menos 5 caracteres'],
      maxlength: [200, 'Título não pode exceder 200 caracteres'],
      index: true,
    },

    description: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
      minlength: [20, 'Descrição deve ter pelo menos 20 caracteres'],
      maxlength: [2500, 'Descrição não pode exceder 2500 caracteres'],
    },

    objectives: {
      type: [String],
      required: [true, 'Objetivos são obrigatórios'],
      validate: {
        validator: function(objectives) {
          return objectives.length >= 1;
        },
        message: 'Pelo menos um objetivo deve ser definido',
      },
    },

    keywords: {
      type: [String],
      required: [true, 'Palavras-chave são obrigatórias'],
      validate: {
        validator: function(keywords) {
          return keywords.length >= 1;
        },
        message: 'Pelo menos uma palavra-chave deve ser definida',
      },
    },

    // ========== RELACIONAMENTOS OBRIGATÓRIOS (do PDF) ==========
    advisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Orientador é obrigatório'],
      validate: {
        validator: async function(userId) {
          // Verificar se o usuário é FACULTY
          const User = mongoose.model('User');
          const user = await User.findById(userId);
          return user && user.type === 'FACULTY';
        },
        message: 'Orientador deve ser um docente (FACULTY)',
      },
      index: true,
    },

    // ========== CAMPOS ADICIONAIS DO CONTEXTO ACADÉMICO ==========
    academic_year: {
      type: String,
      required: true,
      default: function() {
        // Ano académico atual (ex: 2024-2025)
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        return `${currentYear}-${nextYear}`;
      },
      match: [/^\d{4}-\d{4}$/, 'Ano académico deve estar no formato YYYY-YYYY'],
      index: true,
    },

    // ========== STATUS E FLUXO DE TRABALHO ==========
    status: {
      type: String,
      enum: {
        values: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'assigned', 'completed', 'archived'],
        message: 'Status inválido',
      },
      default: 'draft',
      index: true,
    },

    // ========== DATAS DO CICLO DE VIDA ==========
    submitted_at: {
      type: Date,
      default: null,
    },

    approved_at: {
      type: Date,
      default: null,
    },

    assigned_at: {
      type: Date,
      default: null,
    },

    completed_at: {
      type: Date,
      default: null,
    },

    archived_at: {
      type: Date,
      default: null,
    },

    // ========== METADADOS DO SISTEMA ==========
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },

    // ========== AUDITORIA ==========
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== ÍNDICES ==========
proposalSchema.index({ advisor_id: 1, status: 1 });
proposalSchema.index({ academic_year: 1, status: 1 });
proposalSchema.index({ status: 1, created_at: -1 });

// ========== VIRTUAL FIELDS (para populações) ==========
proposalSchema.virtual('advisor', {
  ref: 'User',
  localField: 'advisor_id',
  foreignField: '_id',
  justOne: true,
});

// Coorientadores através da tabela associativa
proposalSchema.virtual('coadvisors', {
  ref: 'ProposalCoadvisor',
  localField: '_id',
  foreignField: 'proposal_id',
  justOne: false,
  match: { status: 'accepted' }, // Apenas coorientadores aceites
});

// Alunos através da tabela associativa
proposalSchema.virtual('students', {
  ref: 'ProposalStudent',
  localField: '_id',
  foreignField: 'proposal_id',
  justOne: false,
  match: { application_status: 'accepted' }, // Apenas alunos aceites
});

// Ficheiros anexados
proposalSchema.virtual('attachments', {
  ref: 'FileAttachment',
  localField: '_id',
  foreignField: 'proposal_id',
  justOne: false,
});

// ========== MÉTODOS DA INSTÂNCIA ==========

/**
 * Submeter a proposta
 */
proposalSchema.methods.submit = async function() {
  if (this.status !== 'draft') {
    throw new Error('Apenas propostas em rascunho podem ser submetidas');
  }
  
  this.status = 'submitted';
  this.submitted_at = new Date();
  await this.save();
};

/**
 * Aprovar a proposta
 */
proposalSchema.methods.approve = async function() {
  if (this.status !== 'submitted' && this.status !== 'under_review') {
    throw new Error('Apenas propostas submetidas ou em revisão podem ser aprovadas');
  }
  
  this.status = 'approved';
  this.approved_at = new Date();
  await this.save();
};

/**
 * Atribuir a proposta a alunos
 */
proposalSchema.methods.assign = async function() {
  if (this.status !== 'approved') {
    throw new Error('Apenas propostas aprovadas podem ser atribuídas');
  }
  
  this.status = 'assigned';
  this.assigned_at = new Date();
  await this.save();
};

/**
 * Marcar como concluída
 */
proposalSchema.methods.complete = async function() {
  if (this.status !== 'assigned') {
    throw new Error('Apenas propostas atribuídas podem ser concluídas');
  }
  
  this.status = 'completed';
  this.completed_at = new Date();
  await this.save();
};

/**
 * Verificar se a proposta pode ser editada
 */
proposalSchema.methods.isEditable = function() {
  return ['draft', 'submitted', 'under_review'].includes(this.status);
};

/**
 * Obter informações do status
 */
proposalSchema.methods.getStatusInfo = function() {
  const statusMap = {
    draft: {
      label: 'Rascunho',
      description: 'A proposta está em edição',
      color: '#9CA3AF',
      canEdit: true,
      canDelete: true,
    },
    submitted: {
      label: 'Submetida',
      description: 'Aguardando revisão',
      color: '#3B82F6',
      canEdit: false,
      canDelete: false,
    },
    under_review: {
      label: 'Em Revisão',
      description: 'Sendo avaliada pela coordenação',
      color: '#F59E0B',
      canEdit: false,
      canDelete: false,
    },
    approved: {
      label: 'Aprovada',
      description: 'Disponível para atribuição a alunos',
      color: '#10B981',
      canEdit: false,
      canDelete: false,
    },
    rejected: {
      label: 'Rejeitada',
      description: 'Não aprovada pela coordenação',
      color: '#EF4444',
      canEdit: false,
      canDelete: true,
    },
    assigned: {
      label: 'Atribuída',
      description: 'Já tem alunos atribuídos',
      color: '#8B5CF6',
      canEdit: false,
      canDelete: false,
    },
    completed: {
      label: 'Concluída',
      description: 'Projeto finalizado',
      color: '#6366F1',
      canEdit: false,
      canDelete: false,
    },
    archived: {
      label: 'Arquivada',
      description: 'Proposta histórica',
      color: '#6B7280',
      canEdit: false,
      canDelete: false,
    },
  };
  
  return statusMap[this.status] || statusMap.draft;
};

// ========== MÉTODOS ESTÁTICOS ==========

/**
 * Encontrar propostas por orientador
 */
proposalSchema.statics.findByAdvisor = function(advisorId) {
  return this.find({ advisor_id: advisorId })
    .sort({ created_at: -1 })
    .populate('advisor');
};

/**
 * Encontrar propostas por status
 */
proposalSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .sort({ created_at: -1 })
    .populate('advisor');
};

/**
 * Encontrar propostas públicas (para alunos verem)
 */
proposalSchema.statics.findPublic = function() {
  return this.find({
    status: { $in: ['approved', 'assigned', 'completed'] },
  })
    .sort({ created_at: -1 })
    .populate('advisor');
};

/**
 * Encontrar propostas disponíveis para alunos se candidatarem
 */
proposalSchema.statics.findAvailableForStudents = function() {
  return this.find({
    status: 'approved',
    // Verificar se ainda tem vagas (através do virtual ou contagem)
  })
    .sort({ created_at: -1 })
    .populate('advisor');
};

/**
 * Contar propostas por status
 */
proposalSchema.statics.countByStatus = async function() {
  const counts = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
  
  // Transformar em objeto
  const result = {};
  counts.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
};

// ========== QUERY HELPERS ==========

/**
 * Helper para filtrar por ano académico
 */
proposalSchema.query.byAcademicYear = function(year) {
  return this.where({ academic_year: year });
};

/**
 * Helper para filtrar por status
 */
proposalSchema.query.byStatus = function(status) {
  return this.where({ status });
};

/**
 * Helper para filtrar propostas editáveis
 */
proposalSchema.query.editable = function() {
  return this.where({
    status: { $in: ['draft', 'submitted', 'under_review'] },
  });
};

// ========== MIDDLEWARES ==========

/**
 * Atualizar timestamp antes de salvar
 */
proposalSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

/**
 * Validações antes de salvar
 */
proposalSchema.pre('save', async function(next) {
  // Validar que o orientador é FACULTY
  if (this.advisor_id && this.isModified('advisor_id')) {
    const User = mongoose.model('User');
    const advisor = await User.findById(this.advisor_id);
    
    if (!advisor) {
      next(new Error('Orientador não encontrado'));
      return;
    }
    
    if (advisor.type !== 'FACULTY') {
      next(new Error('O orientador deve ser um docente'));
      return;
    }
  }
  
  // Auto-definir academic_year se não especificado
  if (!this.academic_year) {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    this.academic_year = `${currentYear}-${nextYear}`;
  }
  
  // Atualizar datas de transição de status
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'submitted':
        this.submitted_at = this.submitted_at || now;
        break;
      case 'approved':
        this.approved_at = this.approved_at || now;
        break;
      case 'assigned':
        this.assigned_at = this.assigned_at || now;
        break;
      case 'completed':
        this.completed_at = this.completed_at || now;
        break;
      case 'archived':
        this.archived_at = this.archived_at || now;
        break;
    }
  }
  
  next();
});

// ========== EXPORTAÇÃO ==========
const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;
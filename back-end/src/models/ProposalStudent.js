// models/ProposalStudent.js - VERSÃO SIMPLIFICADA
import mongoose from 'mongoose';

const proposalStudentSchema = new mongoose.Schema(
  {
    proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true,
    },
    
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Estado específico de cada associação
    status: {
      type: String,
      enum: ['applied', 'accepted', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    
    // Contexto específico (ex: nota de candidatura, prioridade)
    context: {
      application_notes: String,
      priority: {
        type: Number,
        min: 1,
        max: 3,
        default: 1,
      },
    },
    
    applied_at: {
      type: Date,
      default: Date.now,
    },
    
    responded_at: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice único para garantir um aluno por proposta
proposalStudentSchema.index(
  { proposal_id: 1, student_id: 1 },
  { unique: true }
);

// Virtual para o aluno
proposalStudentSchema.virtual('student', {
  ref: 'User',
  localField: 'student_id',
  foreignField: '_id',
  justOne: true,
});

// Virtual para a proposta
proposalStudentSchema.virtual('proposal', {
  ref: 'Proposal',
  localField: 'proposal_id',
  foreignField: '_id',
  justOne: true,
});

const ProposalStudent = mongoose.model('ProposalStudent', proposalStudentSchema);

export default ProposalStudent;
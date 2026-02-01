import mongoose from 'mongoose';

const proposalCoadvisorSchema = new mongoose.Schema(
  {
    proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true,
    },
    
    coadvisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Estado específico de cada associação (do PDF: "estado e contexto específicos")
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    
    // Contexto específico (ex: área de especialidade)
    context: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    
    created_at: {
      type: Date,
      default: Date.now,
    },
    
    responded_at: {
      type: Date,
      default: null,
    },
  },
  {
    // Garantir que cada combinação proposta-coorientador é única
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice único para garantir um coorientador por proposta
proposalCoadvisorSchema.index(
  { proposal_id: 1, coadvisor_id: 1 },
  { unique: true }
);

// Virtual para o coorientador
proposalCoadvisorSchema.virtual('coadvisor', {
  ref: 'User',
  localField: 'coadvisor_id',
  foreignField: '_id',
  justOne: true,
});

// Virtual para a proposta
proposalCoadvisorSchema.virtual('proposal', {
  ref: 'Proposal',
  localField: 'proposal_id',
  foreignField: '_id',
  justOne: true,
});

const ProposalCoadvisor = mongoose.model('ProposalCoadvisor', proposalCoadvisorSchema);

export default ProposalCoadvisor;
import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetSchema = new mongoose.Schema(
  {
    // ========== TOKEN ==========
    token: {
      type: String,
      required: [true, 'Token é obrigatório'],
      unique: true,
      index: true,
    },

    token_hash: {
      type: String,
      required: [true, 'Hash do token é obrigatório'],
      index: true,
    },

    // ========== RELACIONAMENTO ==========
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Utilizador é obrigatório'],
      index: true,
    },

    // ========== VALIDADE ==========
    expires_at: {
      type: Date,
      required: [true, 'Data de expiração é obrigatória'],
      index: true,
    },

    used_at: {
      type: Date,
      default: null,
    },

    // ========== INFORMAÇÕES DO PEDIDO ==========
    requested_from_ip: {
      type: String,
      required: [true, 'Endereço IP é obrigatório'],
      trim: true,
    },

    requested_with_user_agent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent não pode exceder 500 caracteres'],
    },

    // ========== USO ==========
    used_from_ip: {
      type: String,
      default: null,
      trim: true,
    },

    used_with_user_agent: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'User agent não pode exceder 500 caracteres'],
    },

    // ========== STATUS ==========
    status: {
      type: String,
      enum: ['pending', 'used', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },

    // ========== METADADOS ==========
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== ÍNDICES ==========
passwordResetSchema.index({ user_id: 1, status: 1 });
passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ========== VIRTUAL FIELDS ==========
passwordResetSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

passwordResetSchema.virtual('is_expired').get(function() {
  return new Date() > this.expires_at;
});

passwordResetSchema.virtual('is_valid').get(function() {
  return this.status === 'pending' && !this.is_expired;
});

// ========== MÉTODOS DA INSTÂNCIA ==========
passwordResetSchema.methods.markAsUsed = async function(ip = null, userAgent = null) {
  this.status = 'used';
  this.used_at = new Date();
  this.used_from_ip = ip;
  this.used_with_user_agent = userAgent;
  this.updated_at = new Date();
  await this.save();
};

passwordResetSchema.methods.revoke = async function() {
  this.status = 'revoked';
  this.updated_at = new Date();
  await this.save();
};

// ========== MÉTODOS ESTÁTICOS ==========
passwordResetSchema.statics.generateResetTokenString = function() {
  return crypto.randomBytes(32).toString('hex');
};

passwordResetSchema.statics.createHash = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

passwordResetSchema.statics.findValidByToken = function(token) {
  const tokenHash = this.createHash(token);
  
  return this.findOne({
    token_hash: tokenHash,
    status: 'pending',
    expires_at: { $gt: new Date() },
  }).populate('user');
};

passwordResetSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user_id: userId,
    status: 'pending',
    expires_at: { $gt: new Date() },
  }).sort({ created_at: -1 });
};

passwordResetSchema.statics.invalidateAllForUser = async function(userId) {
  return this.updateMany(
    {
      user_id: userId,
      status: 'pending',
    },
    {
      $set: {
        status: 'revoked',
        updated_at: new Date(),
      },
    }
  );
};

passwordResetSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    $or: [
      { expires_at: { $lt: new Date() } },
      { status: { $in: ['used', 'expired', 'revoked'] } },
    ],
  });
};

// ========== MIDDLEWARES ==========
passwordResetSchema.pre('save', function(next) {
  // Gerar token e hash se for novo
  if (this.isNew) {
    if (!this.token) {
      this.token = passwordResetSchema.statics.generateResetTokenString();
    }
    this.token_hash = passwordResetSchema.statics.createHash(this.token);
    
    // Definir expiração padrão (1 hora)
    if (!this.expires_at) {
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
      this.expires_at = expires;
    }
  }
  
  // Atualizar timestamp
  this.updated_at = new Date();
  
  // Atualizar status se expirado
  if (this.status === 'pending' && this.is_expired) {
    this.status = 'expired';
  }
  
  next();
});

// ========== EXPORTAÇÃO ==========
const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
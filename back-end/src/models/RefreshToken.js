// models/RefreshToken.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const refreshTokenSchema = new mongoose.Schema(
  {
    // ========== TOKEN ==========
    token: {
      type: String,
      required: [true, 'Token é obrigatório'],
      unique: true,
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

    // ========== METADADOS ==========
    user_agent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent não pode exceder 500 caracteres'],
    },

    ip_address: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return /^(?:\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/.test(v);
        },
        message: 'Endereço IP inválido',
      },
    },

    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revoked_at: {
      type: Date,
      default: null,
    },

    revoked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    revocation_reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Motivo de revogação não pode exceder 200 caracteres'],
    },

    // ========== SISTEMA ==========
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    last_used_at: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== ÍNDICES ==========
refreshTokenSchema.index({ user_id: 1, revoked: 1 });
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ========== VIRTUAL FIELDS ==========
refreshTokenSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

refreshTokenSchema.virtual('is_expired').get(function() {
  return new Date() > this.expires_at;
});

refreshTokenSchema.virtual('is_active').get(function() {
  return !this.revoked && !this.is_expired;
});

// ========== MÉTODOS DA INSTÂNCIA ==========
refreshTokenSchema.methods.revoke = async function(revokedBy = null, reason = '') {
  this.revoked = true;
  this.revoked_at = new Date();
  this.revoked_by = revokedBy;
  this.revocation_reason = reason;
  await this.save();
};

refreshTokenSchema.methods.markAsUsed = async function() {
  this.last_used_at = new Date();
  await this.save();
};

// ========== MÉTODOS ESTÁTICOS ==========
refreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(40).toString('hex');
};

refreshTokenSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    user_id: userId,
    revoked: false,
    expires_at: { $gt: new Date() },
  }).sort({ created_at: -1 });
};

refreshTokenSchema.statics.revokeAllForUser = async function(userId, revokedBy = null, reason = '') {
  return this.updateMany(
    {
      user_id: userId,
      revoked: false,
    },
    {
      $set: {
        revoked: true,
        revoked_at: new Date(),
        revoked_by: revokedBy,
        revocation_reason: reason,
      },
    }
  );
};

refreshTokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    $or: [
      { expires_at: { $lt: new Date() } },
      { revoked: true },
    ],
  });
};

// ========== MIDDLEWARES ==========
refreshTokenSchema.pre('save', function(next) {
  // Garantir que token é único e seguro
  if (this.isNew && !this.token) {
    this.token = refreshTokenSchema.statics.generateToken();
  }
  
  // Definir expiração padrão se não fornecida (30 dias)
  if (!this.expires_at) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    this.expires_at = expires;
  }
  
  next();
});

// ========== EXPORTAÇÃO ==========
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
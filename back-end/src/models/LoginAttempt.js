// models/LoginAttempt.js
import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema(
  {
    // ========== IDENTIFICAÇÃO ==========
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      lowercase: true,
      trim: true,
      index: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // ========== RESULTADO ==========
    successful: {
      type: Boolean,
      required: true,
      index: true,
    },

    failure_reason: {
      type: String,
      enum: [
        'invalid_credentials',
        'account_locked',
        'account_inactive',
        'ip_blocked',
        'device_blocked',
        'other',
      ],
      default: null,
    },

    // ========== INFORMAÇÕES DA TENTATIVA ==========
    ip_address: {
      type: String,
      required: [true, 'Endereço IP é obrigatório'],
      trim: true,
      index: true,
    },

    user_agent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent não pode exceder 500 caracteres'],
    },

    device_fingerprint: {
      type: String,
      trim: true,
    },

    location_data: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },

    // ========== METADADOS ==========
    attempted_at: {
      type: Date,
      default: Date.now,
      index: true,
    },

    response_time_ms: {
      type: Number,
      min: [0, 'Tempo de resposta não pode ser negativo'],
    },

    // ========== SEGURANÇA ==========
    flagged: {
      type: Boolean,
      default: false,
      index: true,
    },

    flag_reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Motivo de flag não pode exceder 200 caracteres'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== ÍNDICES ==========
loginAttemptSchema.index({ email: 1, attempted_at: -1 });
loginAttemptSchema.index({ ip_address: 1, attempted_at: -1 });
loginAttemptSchema.index({ user_id: 1, attempted_at: -1 });
loginAttemptSchema.index({ successful: 1, attempted_at: -1 });

// ========== VIRTUAL FIELDS ==========
loginAttemptSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

// ========== MÉTODOS ESTÁTICOS ==========
loginAttemptSchema.statics.getRecentAttempts = function(email, ip, minutes = 15) {
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
  
  return this.find({
    $or: [{ email }, { ip_address: ip }],
    attempted_at: { $gte: timeAgo },
  }).sort({ attempted_at: -1 });
};

loginAttemptSchema.statics.countFailedAttempts = function(email, ip, minutes = 15) {
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
  
  return this.countDocuments({
    $or: [{ email }, { ip_address: ip }],
    successful: false,
    attempted_at: { $gte: timeAgo },
  });
};

loginAttemptSchema.statics.cleanupOldAttempts = async function(days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    attempted_at: { $lt: cutoffDate },
  });
};

loginAttemptSchema.statics.getUserLoginHistory = function(userId, limit = 50) {
  return this.find({ user_id: userId })
    .sort({ attempted_at: -1 })
    .limit(limit);
};

loginAttemptSchema.statics.flagSuspiciousAttempt = async function(attemptId, reason) {
  return this.findByIdAndUpdate(
    attemptId,
    {
      $set: {
        flagged: true,
        flag_reason: reason,
      },
    },
    { new: true }
  );
};

// ========== MIDDLEWARES ==========
loginAttemptSchema.pre('save', function(next) {
  // Tentar encontrar user_id pelo email se não fornecido
  if (!this.user_id && this.email) {
    // Isso seria feito no controller
  }
  
  // Calcular response time se não fornecido
  if (this.response_time_ms === undefined) {
    // Em produção, você calcularia com base no tempo real
    this.response_time_ms = Math.floor(Math.random() * 500) + 100; // Simulado
  }
  
  next();
});

// ========== EXPORTAÇÃO ==========
const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

export default LoginAttempt;
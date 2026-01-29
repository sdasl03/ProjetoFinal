// models/AccessLog.js
import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema(
  {
    // ========== IDENTIFICAÇÃO ==========
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null para utilizadores anónimos
      index: true,
    },

    // ========== REQUISIÇÃO ==========
    method: {
      type: String,
      required: [true, 'Método HTTP é obrigatório'],
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      index: true,
    },

    endpoint: {
      type: String,
      required: [true, 'Endpoint é obrigatório'],
      trim: true,
      index: true,
    },

    url: {
      type: String,
      required: [true, 'URL completa é obrigatória'],
      trim: true,
    },

    query_params: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ========== RESPOSTA ==========
    status_code: {
      type: Number,
      required: [true, 'Código de status é obrigatório'],
      min: [100, 'Código de status inválido'],
      max: [599, 'Código de status inválido'],
      index: true,
    },

    response_size_bytes: {
      type: Number,
      min: [0, 'Tamanho da resposta não pode ser negativo'],
    },

    response_time_ms: {
      type: Number,
      required: [true, 'Tempo de resposta é obrigatório'],
      min: [0, 'Tempo de resposta não pode ser negativo'],
    },

    // ========== INFORMAÇÕES DO CLIENTE ==========
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

    device_info: {
      browser: String,
      browser_version: String,
      os: String,
      os_version: String,
      device_type: String, // desktop, mobile, tablet
      is_bot: Boolean,
    },

    location_data: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },

    // ========== METADADOS DA REQUISIÇÃO ==========
    request_id: {
      type: String,
      unique: true,
      index: true,
    },

    session_id: {
      type: String,
      index: true,
    },

    // ========== ERROS ==========
    error_message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Mensagem de erro não pode exceder 1000 caracteres'],
    },

    error_stack: {
      type: String,
      trim: true,
    },

    // ========== SEGURANÇA ==========
    is_suspicious: {
      type: Boolean,
      default: false,
      index: true,
    },

    suspicious_reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Motivo suspeito não pode exceder 200 caracteres'],
    },

    // ========== METADADOS DO SISTEMA ==========
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    service: {
      type: String,
      default: 'api',
      enum: ['api', 'admin', 'auth', 'file'],
      index: true,
    },

    // ========== DADOS SENSÍVEIS (opcional, para debugging) ==========
    request_body: {
      type: mongoose.Schema.Types.Mixed,
      select: false, // Não incluir em queries por padrão
    },

    request_headers: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },

    response_body: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== ÍNDICES ==========
accessLogSchema.index({ timestamp: -1 });
accessLogSchema.index({ user_id: 1, timestamp: -1 });
accessLogSchema.index({ endpoint: 1, timestamp: -1 });
accessLogSchema.index({ status_code: 1, timestamp: -1 });
accessLogSchema.index({ ip_address: 1, timestamp: -1 });
accessLogSchema.index({ is_suspicious: 1, timestamp: -1 });

// Índice TTL para auto-expiração (90 dias)
accessLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ========== VIRTUAL FIELDS ==========
accessLogSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

accessLogSchema.virtual('is_successful').get(function() {
  return this.status_code >= 200 && this.status_code < 400;
});

accessLogSchema.virtual('is_error').get(function() {
  return this.status_code >= 400;
});

accessLogSchema.virtual('is_server_error').get(function() {
  return this.status_code >= 500;
});

// ========== MÉTODOS ESTÁTICOS ==========
accessLogSchema.statics.getUserActivity = function(userId, limit = 100) {
  return this.find({ user_id: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

accessLogSchema.statics.getEndpointStats = function(endpoint, hours = 24) {
  const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        endpoint,
        timestamp: { $gte: timeAgo },
      },
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          status: '$status_code',
        },
        count: { $sum: 1 },
        avg_response_time: { $avg: '$response_time_ms' },
        errors: {
          $sum: {
            $cond: [{ $gte: ['$status_code', 400] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { '_id.hour': 1 },
    },
  ]);
};

accessLogSchema.statics.getSuspiciousActivity = function(hours = 24, limit = 50) {
  const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    is_suspicious: true,
    timestamp: { $gte: timeAgo },
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

accessLogSchema.statics.cleanupOldLogs = async function(days = 90) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
  });
};

accessLogSchema.statics.logRequest = async function(logData) {
  try {
    // Gerar request ID único se não fornecido
    if (!logData.request_id) {
      logData.request_id = require('crypto').randomBytes(16).toString('hex');
    }
    
    // Processar user agent para extrair info do dispositivo
    if (logData.user_agent && !logData.device_info) {
      // Aqui você poderia usar uma biblioteca como ua-parser-js
      logData.device_info = {
        browser: 'Unknown',
        os: 'Unknown',
        device_type: 'desktop',
        is_bot: false,
      };
    }
    
    const log = new this(logData);
    return await log.save();
  } catch (error) {
    console.error('Failed to save access log:', error);
    return null;
  }
};

// ========== MIDDLEWARES ==========
accessLogSchema.pre('save', function(next) {
  // Auto-detectar atividades suspeitas
  if (!this.is_suspicious) {
    // Exemplo de deteção simples
    const suspiciousPatterns = [
      this.status_code === 401 || this.status_code === 403, // Auth failures
      this.response_time_ms > 10000, // Very slow requests
      this.endpoint.includes('admin') && !this.user_id, // Admin access without auth
    ];
    
    if (suspiciousPatterns.some(pattern => pattern)) {
      this.is_suspicious = true;
      this.suspicious_reason = 'Auto-detected suspicious pattern';
    }
  }
  
  // Calcular tamanho aproximado da resposta se não fornecido
  if (!this.response_size_bytes && this.response_body) {
    this.response_size_bytes = JSON.stringify(this.response_body).length;
  }
  
  next();
});

// ========== EXPORTAÇÃO ==========
const AccessLog = mongoose.model('AccessLog', accessLogSchema);

export default AccessLog;
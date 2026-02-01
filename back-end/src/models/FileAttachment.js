import mongoose from 'mongoose';

const fileAttachmentSchema = new mongoose.Schema(
  {
    // ========== IDENTIFICAÇÃO ==========
    filename: {
      type: String,
      required: [true, 'Nome do ficheiro é obrigatório'],
      trim: true,
      index: true,
    },

    original_filename: {
      type: String,
      required: [true, 'Nome original do ficheiro é obrigatório'],
      trim: true,
    },

    // ========== METADADOS DO FICHEIRO ==========
    file_size_bytes: {
      type: Number,
      required: [true, 'Tamanho do ficheiro é obrigatório'],
      min: [1, 'Tamanho do ficheiro deve ser pelo menos 1 byte'],
    },

    mime_type: {
      type: String,
      required: [true, 'Tipo MIME é obrigatório'],
      trim: true,
      index: true,
    },

    file_extension: {
      type: String,
      trim: true,
      maxlength: [10, 'Extensão do ficheiro não pode exceder 10 caracteres'],
    },

    // ========== GRIDFS REFERÊNCIAS ==========
    gridfs_file_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'ID do ficheiro GridFS é obrigatório'],
      index: true,
    },

    gridfs_bucket_name: {
      type: String,
      default: 'uploads',
      index: true,
    },

    // ========== RELACIONAMENTOS ==========
    proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      index: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Utilizador é obrigatório'],
      index: true,
    },

    // ========== CATEGORIA E TIPO ==========
    category: {
      type: String,
      enum: [
        'proposal_document',
        'supporting_material',
        'student_application',
        'review_document',
        'final_report',
        'other',
      ],
      default: 'other',
      index: true,
    },

    document_type: {
      type: String,
      enum: [
        'pdf',
        'word',
        'excel',
        'powerpoint',
        'image',
        'text',
        'archive',
        'other',
      ],
      required: true,
      index: true,
    },

    // ========== DESCRIÇÃO E TAGS ==========
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Descrição não pode exceder 500 caracteres'],
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // ========== VISIBILIDADE E ACESSO ==========
    is_public: {
      type: Boolean,
      default: false,
      index: true,
    },

    access_level: {
      type: String,
      enum: ['private', 'department', 'faculty', 'students', 'public'],
      default: 'private',
      index: true,
    },

    allowed_users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    // ========== VERSÕES ==========
    version: {
      type: Number,
      default: 1,
    },

    previous_version_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FileAttachment',
      default: null,
    },

    // ========== ESTATÍSTICAS DE USO ==========
    download_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    last_downloaded_at: {
      type: Date,
      default: null,
    },

    // ========== VALIDAÇÃO E SEGURANÇA ==========
    md5_hash: {
      type: String,
      trim: true,
      match: [/^[a-f0-9]{32}$/, 'Hash MD5 inválido'],
    },

    sha256_hash: {
      type: String,
      trim: true,
      match: [/^[a-f0-9]{64}$/, 'Hash SHA256 inválido'],
    },

    scan_status: {
      type: String,
      enum: ['pending', 'scanning', 'clean', 'infected', 'error'],
      default: 'pending',
    },

    scan_result: {
      type: String,
      trim: true,
    },

    scanned_at: {
      type: Date,
      default: null,
    },

    // ========== METADADOS DO SISTEMA ==========
    uploaded_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },

    deleted_at: {
      type: Date,
      default: null,
    },

    deleted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ========== INFORMAÇÕES DO UPLOAD ==========
    upload_ip: {
      type: String,
      trim: true,
    },

    upload_user_agent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent não pode exceder 500 caracteres'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== ÍNDICES ==========
fileAttachmentSchema.index({ proposal_id: 1, category: 1 });
fileAttachmentSchema.index({ user_id: 1, uploaded_at: -1 });
fileAttachmentSchema.index({ mime_type: 1, uploaded_at: -1 });
fileAttachmentSchema.index({ tags: 1 });
fileAttachmentSchema.index({ uploaded_at: -1 });

// ========== VIRTUAL FIELDS ==========
fileAttachmentSchema.virtual('proposal', {
  ref: 'Proposal',
  localField: 'proposal_id',
  foreignField: '_id',
  justOne: true,
});

fileAttachmentSchema.virtual('uploader', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

fileAttachmentSchema.virtual('file_size_mb').get(function() {
  return (this.file_size_bytes / (1024 * 1024)).toFixed(2);
});

fileAttachmentSchema.virtual('file_size_kb').get(function() {
  return (this.file_size_bytes / 1024).toFixed(2);
});

fileAttachmentSchema.virtual('is_image').get(function() {
  return this.mime_type.startsWith('image/');
});

fileAttachmentSchema.virtual('is_pdf').get(function() {
  return this.mime_type === 'application/pdf';
});

fileAttachmentSchema.virtual('is_deleted').get(function() {
  return this.deleted_at !== null;
});

// ========== MÉTODOS DA INSTÂNCIA ==========
fileAttachmentSchema.methods.incrementDownloadCount = async function() {
  this.download_count += 1;
  this.last_downloaded_at = new Date();
  await this.save();
};

fileAttachmentSchema.methods.softDelete = async function(deletedBy = null) {
  this.deleted_at = new Date();
  this.deleted_by = deletedBy;
  await this.save();
};

fileAttachmentSchema.methods.restore = async function() {
  this.deleted_at = null;
  this.deleted_by = null;
  await this.save();
};

fileAttachmentSchema.methods.hasAccess = function(user) {
  if (this.is_deleted) return false;
  
  // Dono tem sempre acesso
  if (this.user_id.equals(user._id)) return true;
  
  // Se é público
  if (this.is_public || this.access_level === 'public') return true;
  
  // Se o usuário está na lista de permissões
  if (this.allowed_users.some(allowedId => allowedId.equals(user._id))) {
    return true;
  }
  
  // Verificar por tipo de usuário
  switch (this.access_level) {
    case 'faculty':
      return user.type === 'FACULTY' || user.type === 'ADMIN';
    case 'students':
      return user.type === 'STUDENT';
    case 'department':
      return user.department === this.proposal?.department;
    default:
      return false;
  }
};

// ========== MÉTODOS ESTÁTICOS ==========
fileAttachmentSchema.statics.findByProposal = function(proposalId, includeDeleted = false) {
  const query = { proposal_id: proposalId };
  if (!includeDeleted) {
    query.deleted_at = null;
  }
  return this.find(query).sort({ uploaded_at: -1 });
};

fileAttachmentSchema.statics.findByUser = function(userId, includeDeleted = false) {
  const query = { user_id: userId };
  if (!includeDeleted) {
    query.deleted_at = null;
  }
  return this.find(query).sort({ uploaded_at: -1 });
};

fileAttachmentSchema.statics.findPublicFiles = function() {
  return this.find({
    deleted_at: null,
    $or: [
      { is_public: true },
      { access_level: 'public' },
    ],
  }).sort({ uploaded_at: -1 });
};

fileAttachmentSchema.statics.getStorageStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { deleted_at: null },
    },
    {
      $group: {
        _id: {
          category: '$category',
          mime_type: '$mime_type',
        },
        count: { $sum: 1 },
        total_size: { $sum: '$file_size_bytes' },
        avg_size: { $avg: '$file_size_bytes' },
      },
    },
    {
      $sort: { total_size: -1 },
    },
  ]);
  
  const totalStats = await this.aggregate([
    {
      $match: { deleted_at: null },
    },
    {
      $group: {
        _id: null,
        total_files: { $sum: 1 },
        total_size: { $sum: '$file_size_bytes' },
        avg_size: { $avg: '$file_size_bytes' },
      },
    },
  ]);
  
  return {
    by_category: stats,
    total: totalStats[0] || { total_files: 0, total_size: 0, avg_size: 0 },
  };
};

// ========== MIDDLEWARES ==========
fileAttachmentSchema.pre('save', function(next) {
  // Extrair extensão do filename
  if (this.original_filename && !this.file_extension) {
    const parts = this.original_filename.split('.');
    if (parts.length > 1) {
      this.file_extension = parts[parts.length - 1].toLowerCase();
    }
  }
  
  // Determinar document_type baseado no mime_type
  if (this.mime_type && !this.document_type) {
    if (this.mime_type.startsWith('image/')) {
      this.document_type = 'image';
    } else if (this.mime_type.includes('pdf')) {
      this.document_type = 'pdf';
    } else if (this.mime_type.includes('word') || this.mime_type.includes('document')) {
      this.document_type = 'word';
    } else if (this.mime_type.includes('excel') || this.mime_type.includes('spreadsheet')) {
      this.document_type = 'excel';
    } else if (this.mime_type.includes('powerpoint') || this.mime_type.includes('presentation')) {
      this.document_type = 'powerpoint';
    } else if (this.mime_type.startsWith('text/')) {
      this.document_type = 'text';
    } else if (this.mime_type.includes('zip') || this.mime_type.includes('compressed')) {
      this.document_type = 'archive';
    } else {
      this.document_type = 'other';
    }
  }
  
  // Atualizar timestamp
  this.updated_at = new Date();
  
  next();
});

// ========== EXPORTAÇÃO ==========
const FileAttachment = mongoose.model('FileAttachment', fileAttachmentSchema);

export default FileAttachment;
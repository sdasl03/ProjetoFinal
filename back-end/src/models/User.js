import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Nome completo é obrigatório'],
    trim: true,
  },
  
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Por favor, forneça um email válido',
    },
  },
  
  type: {
    type: String,
    enum: ['FACULTY', 'STUDENT', 'ADMIN'],
    required: [true, 'Tipo de utilizador é obrigatório'],
  },
  
  department: {
    type: String,
    required: [true, 'Departamento é obrigatório'],
    trim: true,
  },
  
  employee_number: {
    type: String,
    trim: true,
    sparse: true,  
    unique: true,  
  },
  
  student_number: {
    type: String,
    trim: true,
    sparse: true,  
    unique: true, 
  },
  
  password: {
    type: String,
    required: [true, 'Password é obrigatória'],
    minlength: [8, 'Password deve ter pelo menos 8 caracteres'],
  },
  
  password_changed_at: {
    type: Date,
  },
  
  active: {
    type: Boolean,
    default: true,
  },
  
  last_login: {
    type: Date,
  },
  
}, {
  timestamps: true,
});

// ==================== MIDDLEWARES ====================
userSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.password_changed_at = Date.now();
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
});

// ==================== METHODS ====================

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.password_changed_at) {
    const changedTimestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Remove password when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.password_changed_at;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;  
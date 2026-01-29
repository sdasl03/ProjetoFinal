// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Nome completo é obrigatório'],
    trim: true,
    minlength: [3, 'Nome deve ter pelo menos 3 caracteres'],
    maxlength: [100, 'Nome não pode exceder 100 caracteres'],
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
  
  // ... resto do schema conforme sua classe
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.auth_password_hash);
};

// Middleware para hash da password antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('auth_password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.auth_password_hash = await bcrypt.hash(this.auth_password_hash, salt);
    this.auth_password_changed_at = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

export default User;
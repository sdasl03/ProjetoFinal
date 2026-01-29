// routes/auth.routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import LoginAttempt from '../models/LoginAttempt.js';
import PasswordReset from '../models/PasswordReset.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  unauthorizedResponse 
} from '../utils/response.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registar novo utilizador
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, type, department, student_number, employee_number } = req.body;

    // Validações básicas
    if (!full_name || !email || !password || !type || !department) {
      return errorResponse(res, 'Campos obrigatórios em falta', 400);
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictResponse(res, 'Email já registado');
    }

    // Verificar student_number ou employee_number baseado no tipo
    if (type === 'STUDENT') {
      if (!student_number) {
        return errorResponse(res, 'Número de estudante é obrigatório para alunos', 400);
      }
      const existingStudent = await User.findOne({ student_number });
      if (existingStudent) {
        return conflictResponse(res, 'Número de estudante já registado');
      }
    } else if (type === 'FACULTY' || type === 'ADMIN') {
      if (!employee_number) {
        return errorResponse(res, 'Número de funcionário é obrigatório', 400);
      }
      const existingEmployee = await User.findOne({ employee_number });
      if (existingEmployee) {
        return conflictResponse(res, 'Número de funcionário já registado');
      }
    }

    // Criar utilizador
    const user = await User.create({
      full_name,
      email,
      type,
      department,
      student_number: type === 'STUDENT' ? student_number : null,
      employee_number: type !== 'STUDENT' ? employee_number : null,
      auth_password_hash: password, // Será hasheado pelo middleware pre-save
      active: true,
    });

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = await generateRefreshToken(user, req);

    return successResponse(res, {
      user: user.toAuthJSON(),
      token,
      refreshToken: refreshToken.token,
    }, 'Registo bem-sucedido', 201);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro no registo', 500);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar utilizador
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validações básicas
    if (!email || !password) {
      return errorResponse(res, 'Email e password são obrigatórios', 400);
    }

    // Verificar tentativas de login recentes
    const recentAttempts = await LoginAttempt.countFailedAttempts(email, ip, config.auth.lockoutTimeMinutes);
    if (recentAttempts >= config.auth.maxLoginAttempts) {
      await LoginAttempt.create({
        email,
        successful: false,
        failure_reason: 'account_locked',
        ip_address: ip,
        user_agent: userAgent,
      });
      
      return unauthorizedResponse(res, 'Conta temporariamente bloqueada. Tente novamente mais tarde.');
    }

    // Buscar utilizador com password
    const user = await User.findByEmailWithPassword(email);
    
    // Registar tentativa (mesmo se utilizador não existir)
    const loginAttempt = {
      email,
      user_id: user?._id || null,
      successful: false,
      ip_address: ip,
      user_agent: userAgent,
    };

    if (!user) {
      loginAttempt.failure_reason = 'invalid_credentials';
      await LoginAttempt.create(loginAttempt);
      return unauthorizedResponse(res, 'Credenciais inválidas');
    }

    if (!user.active) {
      loginAttempt.failure_reason = 'account_inactive';
      await LoginAttempt.create(loginAttempt);
      return unauthorizedResponse(res, 'Conta desativada. Contacte o administrador.');
    }

    // Verificar password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      loginAttempt.failure_reason = 'invalid_credentials';
      await LoginAttempt.create(loginAttempt);
      return unauthorizedResponse(res, 'Credenciais inválidas');
    }

    // Login bem-sucedido
    loginAttempt.successful = true;
    await LoginAttempt.create(loginAttempt);
    
    // Resetar contador de tentativas falhadas
    await user.resetLoginAttempts();

    // Atualizar last_login
    user.last_login = new Date();
    user.last_ip = ip;
    await user.save();

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = await generateRefreshToken(user, req);

    return successResponse(res, {
      user: user.toAuthJSON(),
      token,
      refreshToken: refreshToken.token,
    }, 'Login bem-sucedido');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Erro no login', 500);
  }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Atualizar token de acesso
 * @access  Public (com refresh token)
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token é obrigatório', 400);
    }

    // Buscar refresh token válido
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
      expires_at: { $gt: new Date() },
    }).populate('user_id');

    if (!storedToken) {
      return unauthorizedResponse(res, 'Refresh token inválido ou expirado');
    }

    // Marcar como usado
    await storedToken.markAsUsed();

    // Gerar novo token
    const user = storedToken.user_id;
    const newToken = generateToken(user);
    const newRefreshToken = await generateRefreshToken(user, req);

    return successResponse(res, {
      token: newToken,
      refreshToken: newRefreshToken.token,
    }, 'Token atualizado com sucesso');

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 'Erro ao atualizar token', 500);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Terminar sessão
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Se fornecido um refresh token específico, revogá-lo
    if (refreshToken) {
      const token = await RefreshToken.findOne({ token: refreshToken });
      if (token) {
        await token.revoke(req.user._id, 'Logout manual');
      }
    } else {
      // Revogar todos os refresh tokens do utilizador
      await RefreshToken.revokeAllForUser(req.user._id, req.user._id, 'Logout geral');
    }

    return successResponse(res, null, 'Logout bem-sucedido');

  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Erro no logout', 500);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de password
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email é obrigatório', 400);
    }

    const user = await User.findOne({ email });

    // Não revelar se o email existe por questões de segurança
    if (!user) {
      return successResponse(res, null, 'Se o email existir, receberá instruções para resetar a password');
    }

    if (!user.active) {
      return errorResponse(res, 'Conta desativada', 400);
    }

    // Invalidar tokens anteriores
    await PasswordReset.invalidateAllForUser(user._id);

    // Criar novo token de reset
    const passwordReset = await PasswordReset.create({
      user_id: user._id,
      requested_from_ip: req.ip,
      requested_with_user_agent: req.get('User-Agent'),
    });

    // Em produção, enviar email com o token
    // await sendPasswordResetEmail(user.email, passwordReset.token);

    // Em desenvolvimento, retornar o token (REMOVER EM PRODUÇÃO)
    const response = {
      message: 'Instruções enviadas para o email',
    };

    if (config.server.nodeEnv === 'development') {
      response.resetToken = passwordReset.token;
      response.resetUrl = `${config.frontend.url}/reset-password?token=${passwordReset.token}`;
    }

    return successResponse(res, response, 'Pedido de reset de password processado');

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 'Erro ao processar pedido', 500);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetar password com token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, 'Token e nova password são obrigatórios', 400);
    }

    // Validar nova password
    if (newPassword.length < 6) {
      return errorResponse(res, 'Password deve ter pelo menos 6 caracteres', 400);
    }

    // Buscar token válido
    const passwordReset = await PasswordReset.findValidByToken(token);

    if (!passwordReset) {
      return unauthorizedResponse(res, 'Token inválido ou expirado');
    }

    // Atualizar password do utilizador
    const user = passwordReset.user;
    user.auth_password_hash = newPassword; // Será hasheado pelo middleware
    await user.save();

    // Marcar token como usado
    await passwordReset.markAsUsed(req.ip, req.get('User-Agent'));

    // Invalidar todos os refresh tokens
    await RefreshToken.revokeAllForUser(user._id, user._id, 'Password reset');

    return successResponse(res, null, 'Password atualizada com sucesso');

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'Erro ao resetar password', 500);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obter perfil do utilizador autenticado
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Populate informações adicionais se necessário
    const user = await User.findById(req.user._id);

    if (!user) {
      return notFoundResponse(res, 'Utilizador');
    }

    return successResponse(res, {
      user: user.toAuthJSON(),
    }, 'Perfil obtido com sucesso');

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Erro ao obter perfil', 500);
  }
});

/**
 * @route   PUT /api/auth/me
 * @desc    Atualizar perfil do utilizador
 * @access  Private
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { full_name, department, course } = req.body;
    const updates = {};

    // Campos permitidos para atualização
    if (full_name) updates.full_name = full_name;
    if (department) updates.department = department;
    if (course) updates.course = course;

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 'Nenhum campo para atualizar', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return successResponse(res, {
      user: user.toAuthJSON(),
    }, 'Perfil atualizado com sucesso');

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao atualizar perfil', 500);
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Alterar password do utilizador autenticado
 * @access  Private
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Password atual e nova password são obrigatórias', 400);
    }

    // Verificar password atual
    const user = await User.findByEmailWithPassword(req.user.email);
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Password atual incorreta');
    }

    // Validar nova password
    if (newPassword.length < 6) {
      return errorResponse(res, 'Nova password deve ter pelo menos 6 caracteres', 400);
    }

    if (currentPassword === newPassword) {
      return errorResponse(res, 'Nova password deve ser diferente da atual', 400);
    }

    // Atualizar password
    user.auth_password_hash = newPassword; // Será hasheado pelo middleware
    await user.save();

    // Invalidar todos os refresh tokens (logout de todos os dispositivos)
    await RefreshToken.revokeAllForUser(user._id, user._id, 'Password changed');

    return successResponse(res, null, 'Password alterada com sucesso');

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Erro ao alterar password', 500);
  }
});

// Funções auxiliares
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      type: user.type,
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
};

const generateRefreshToken = async (user, req) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.auth.refreshTokenExpiresDays);

  return await RefreshToken.create({
    user_id: user._id,
    expires_at: expiresAt,
    user_agent: req.get('User-Agent'),
    ip_address: req.ip || req.connection.remoteAddress,
  });
};

export default router;
// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/env.js';

/**
 * Middleware para verificar token JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Obter token do header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Acesso não autorizado. Token não fornecido.',
      });
    }

    // 2. Verificar token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // 3. Buscar utilizador
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Utilizador não encontrado.',
      });
    }

    if (!user.active) {
      return res.status(401).json({
        error: 'Conta desativada. Contacte o administrador.',
      });
    }

    // 4. Verificar se a password foi alterada após o token ser emitido
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        error: 'Password alterada recentemente. Faça login novamente.',
      });
    }

    // 5. Anexar utilizador à requisição
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado.',
      });
    }
    
    res.status(401).json({
      error: 'Falha na autenticação.',
    });
  }
};

/**
 * Middleware para verificar autorização por role
 * @param {...string} allowedRoles - Roles permitidos
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação necessária.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permissão negada. Role insuficiente.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware para verificar permissões específicas
 * @param {...string} permissions - Permissões necessárias
 */
export const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação necessária.',
      });
    }

    // Obter permissões do utilizador baseado no seu role
    const userPermissions = getUserPermissions(req.user.role);

    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Permissão negada.',
        requiredPermissions: permissions,
        userPermissions: userPermissions,
      });
    }

    next();
  };
};

/**
 * Middleware para logging de requisições
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Interceptar response.json para logar respostas
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'none',
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Função auxiliar para obter permissões por role
 * @param {string} role - Role do utilizador
 * @returns {array} - Array de permissões
 */
function getUserPermissions(role) {
  const rolePermissions = {
    admin: [
      'read:users',
      'create:users',
      'update:users',
      'delete:users',
      'read:proposals',
      'create:proposals',
      'update:proposals',
      'delete:proposals',
      'manage:system',
      'view:reports',
    ],
    professor: [
      'read:users',
      'read:proposals',
      'create:proposals',
      'update:proposals',
      'read:students',
      'manage:coadvisors',
      'view:reports',
    ],
    coadvisor: [
      'read:users',
      'read:proposals',
      'read:students',
      'update:proposals',
      'view:reports',
    ],
    student: [
      'read:users',
      'read:proposals',
      'apply:proposals',
      'read:applications',
      'upload:files',
    ],
  };

  return rolePermissions[role] || [];
}

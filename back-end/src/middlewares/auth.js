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

    if (!allowedRoles.includes(req.user.type)) {
      return res.status(403).json({
        error: 'Permissão negada. Tipo de utilizador insuficiente.',
        requiredRoles: allowedRoles,
        userType: req.user.type,
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
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação necessária.',
      });
    }

    // Use user.type instead of user.role
    const userType = req.user.type || req.user.role;
    
    if (!userType) {
      return res.status(403).json({
        error: 'Tipo de utilizador não definido.',
      });
    }

    // Get permissions based on user type
    const userPermissions = getUserPermissions(userType);
    
    console.log('Permission check:', {
      userType,
      requiredPermissions: permissions,
      userPermissions,
      userId: req.user.id
    });

    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Permissão negada.',
        requiredPermissions: permissions,
        userPermissions: userPermissions,
        userType: userType,
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
 * Função auxiliar para obter permissões por tipo de utilizador
 * @param {string} userType - Tipo de utilizador
 * @returns {array} - Array de permissões
 */
// In middleware/auth.js - Complete fixed version
function getUserPermissions(userType) {
  console.log('\n=== GET USER PERMISSIONS DEBUG ===');
  console.log('Input userType:', userType);
  console.log('Type of userType:', typeof userType);
  
  // CORRECTED: Define typePermissions object properly
  const typePermissions = {
    'ADMIN': [
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
      'proposals:create',
      'proposals:read',
      'proposals:update',
      'proposals:delete',
    ],
    'FACULTY': [
      'read:users',
      'read:proposals',
      'create:proposals',
      'update:proposals',
      'read:students',
      'manage:coadvisors',
      'view:reports',
      'proposals:create',
      'proposals:read',
      'proposals:update',
      'proposals:delete',
    ],
    'COADVISOR': [
      'read:users',
      'read:proposals',
      'read:students',
      'update:proposals',
      'view:reports',
      'proposals:read',
      'proposals:update',
    ],
    'STUDENT': [
      'read:users',
      'read:proposals',
      'apply:proposals',
      'read:applications',
      'upload:files',
      'proposals:read',
      'proposals:apply',
    ],
  };

  // Normalize the userType
  const normalizedType = String(userType || '').toUpperCase().trim();
  console.log('Normalized type:', normalizedType);
  console.log('Available keys:', Object.keys(typePermissions));
  
  const permissions = typePermissions[normalizedType] || [];
  console.log('Returning permissions:', permissions);
  console.log('Permissions length:', permissions.length);
  
  return permissions;
}

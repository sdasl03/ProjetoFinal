
import process from 'process';
import config from '../config/env.js';
/**
 * Formatar respostas de sucesso
 */
export const successResponse = (res, data = {}, message = 'Operação bem-sucedida', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Formatar respostas de erro
 */
export const errorResponse = (res, message = 'Ocorreu um erro', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  if (config.server.nodeEnv === 'development' && errors?.stack) {
    response.stack = errors.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Formatar respostas de validação
 */
export const validationErrorResponse = (res, errors) => {
  return errorResponse(
    res,
    'Erro de validação',
    422,
    errors
  );
};

/**
 * Formatar respostas de não encontrado
 */
export const notFoundResponse = (res, resource = 'Recurso') => {
  return errorResponse(
    res,
    `${resource} não encontrado`,
    404
  );
};

/**
 * Formatar respostas de conflito
 */
export const conflictResponse = (res, message = 'Conflito de dados') => {
  return errorResponse(res, message, 409);
};

/**
 * Formatar respostas de acesso negado
 */
export const forbiddenResponse = (res, message = 'Acesso negado') => {
  return errorResponse(res, message, 403);
};

/**
 * Formatar respostas de não autorizado
 */
export const unauthorizedResponse = (res, message = 'Não autorizado') => {
  return errorResponse(res, message, 401);
};
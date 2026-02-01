// server.js (ou app.js/index.js)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './src/config/database.js';
import config, { isDevelopment } from './src/config/env.js';
import { requestLogger } from './src/middlewares/auth.js';
import mongoose from 'mongoose';

import {
  authRoutes, 
  userRoutes, 
  proposalRoutes, 
  coadvisorRoutes, 
  studentRoutes, 
  fileRoutes 
} from './src/routes/index.js';

import dotenv from 'dotenv';
dotenv.config();
// Inicializar app
const app = express();
const PORT = config.server.port;

// Conectar ao MongoDB
connectDB().then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch((error) => {
  console.error('❌ MongoDB connection failed:', error);
  process.exit(1);
});

// Middlewares básicos
app.use(helmet({
  contentSecurityPolicy: isDevelopment() ? false : undefined,
})); // Segurança HTTP headers
app.use(cors({
 origin: config.server.corsOrigin,
  credentials: config.server.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Logging
if (isDevelopment()) {
  app.use(morgan(config.logging.morganFormat));
}


// Rotas de API
const apiPrefix = config.server.apiPrefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/proposals`, proposalRoutes);
app.use(`${apiPrefix}/coadvisors`, coadvisorRoutes);
app.use(`${apiPrefix}/students`, studentRoutes);
app.use(`${apiPrefix}/files`, fileRoutes);


// Rota de health check
app.get(`${apiPrefix}/health`, (req, res) => {
  res.json({
     status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Final Projects Management API',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Rota de informações da API
app.get(`${apiPrefix}/info`, (req, res) => {
  res.json({
    name: 'Sistema de Gestão de Propostas Finais',
    description: 'API para gestão de propostas de projetos finais',
    version: '1.0.0',
    author: 'Samuel Rodrigues de Almeida Simões Lira',
    environment: config.server.nodeEnv,
    endpoints: [
      `${apiPrefix}/auth - Autenticação`,
      `${apiPrefix}/users - Gestão de utilizadores`,
      `${apiPrefix}/proposals - Gestão de propostas`,
      `${apiPrefix}/coadvisors - Coorientadores`,
      `${apiPrefix}/students - Alunos e candidaturas`,
      `${apiPrefix}/files - Upload de ficheiros`,
    ],
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler middleware
app.use((error, req, res, next) => {
  console.error('🔥 Error:', error);

  const statusCode = error.statusCode || 500;
  const message = config.server.isProduction && statusCode === 500 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.isDevelopment && { stack: error.stack }),
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);//review
});


// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received. Iniciando shutdown...`);
  
  try {
    // Fechar conexão com MongoDB
    await mongoose.connection.close();
    console.log('✅ Conexão MongoDB fechada');
    
    // Fechar servidor
    server.close(() => {
      console.log('✅ Servidor HTTP fechado');
      console.log('👋 Shutdown completo');
      process.exit(0);
    });
    
    // Timeout de segurança
    setTimeout(() => {
      console.error('❌ Timeout durante shutdown. Forçando saída.');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Erro durante shutdown:', error);
    process.exit(1);
  }
};

// Capturar sinais de término
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Capturar exceções não tratadas
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não tratada:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejeição não tratada em:', promise, 'razão:', reason);
  shutdown('unhandledRejection');
});

export default app;
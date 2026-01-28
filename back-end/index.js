// server.js (ou app.js/index.js)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/database.js';
import config, { isProduction } from './config/env.js';

// Importar rotas (exemplo)
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import proposalRoutes from './routes/proposal.routes.js';

// Inicializar app
const app = express();

// Middlewares básicos
app.use(helmet()); // Segurança HTTP headers
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (!isProduction()) {
  app.use(morgan('dev')); // Log apenas em desenvolvimento
}

// Conectar ao MongoDB
connectDB().then(() => {
  console.log('✅ Database connection established');
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error);
  process.exit(1);
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/proposals', proposalRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: config.server.nodeEnv,
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
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
    error: message,
    ...(config.server.isDevelopment && { stack: error.stack }),
  });
});

// Iniciar servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
// config/env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Determinar o caminho do diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

// Validação das variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.error('❌ Variáveis de ambiente obrigatórias em falta:');
  missingEnvVars.forEach((envVar) => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n💡 Solução:');
  console.error('   1. Crie um arquivo .env na raiz do projeto');
  console.error('   2. Copie o conteúdo de .env.example para .env');
  console.error('   3. Preencha os valores necessários');
  
  process.exit(1);
}

// Validações adicionais
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  Aviso: JWT_SECRET deve ter pelo menos 32 caracteres para segurança');
}

if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
  console.warn('⚠️  Aviso: NODE_ENV deve ser development, production ou test');
}

// Configurações do servidor
const serverConfig = {
  // Geral
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  
  // Servidor
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || 'localhost',
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // CORS
  corsOrigin: process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:8080',
  corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // Upload
  uploadMaxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  uploadAllowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed',
  ],
};

// Configurações de autenticação
const authConfig = {
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

  
  // Password
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  passwordMinLength: 6,
  
  // Login security
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockoutTimeMinutes: parseInt(process.env.LOCKOUT_TIME_MINUTES) || 15,
  
  // Refresh tokens
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '15d',
  refreshTokenCleanupIn: process.env.REFRESH_TOKEN_CLEANUP_IN || '90d',
  
  // Password reset
  passwordResetExpiresHours: parseInt(process.env.PASSWORD_RESET_EXPIRES_HOURS) || 1,
};
// Configurações do banco de dados
const databaseConfig = {
  // MongoDB
  mongodbUri: process.env.MONGODB_URI,
  mongodbOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 1,
    connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 10000,
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
  },
  
  // Redis (se for usar para cache/sessions)
  redisUri: process.env.REDIS_URI,
  
  // GridFS
  gridfsBucketName: process.env.GRIDFS_BUCKET_NAME || 'uploads',
  gridfsChunkSize: parseInt(process.env.GRIDFS_CHUNK_SIZE) || 255 * 1024, // 255KB
};

// Configurações do frontend
const frontendConfig = {
  url: process.env.FRONTEND_URL || 'http://localhost:8080',
  routes: {
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
    login: '/login',
  },
};

// Configurações de logging
const loggingConfig = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: process.env.LOG_FORMAT || 'combined',
  file: {
    enabled: process.env.LOG_FILE_ENABLED === 'true',
    path: process.env.LOG_FILE_PATH || 'logs/app.log',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
  },
  morganFormat: process.env.MORGAN_FORMAT || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev'),
};


// Configuração completa
export const config = {
  server: serverConfig,
  auth: authConfig,
  database: databaseConfig,
  frontend: frontendConfig,
  logging: loggingConfig,
};

// Funções auxiliares
export const isProduction = () => config.server.isProduction;
export const isDevelopment = () => config.server.isDevelopment;
export const isTest = () => config.server.isTest;

/**
 * Obtém uma configuração específica usando notação de ponto
 * @param {string} path - Caminho da configuração (ex: 'server.port')
 * @returns {any} - Valor da configuração
 */
export const getConfig = (path) => {
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`⚠️  Configuração não encontrada: ${path}`);
      return undefined;
    }
  }
  
  return value;
};

/**
 * Valida todas as configurações
 * @returns {boolean} - True se todas as configurações são válidas
 */
export const validateConfig = () => {
  const errors = [];
  
  // Validar MongoDB URI
  if (!config.database.mongodbUri) {
    errors.push('MONGODB_URI não definida');
  } else if (!config.database.mongodbUri.startsWith('mongodb://') && 
             !config.database.mongodbUri.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI deve começar com mongodb:// ou mongodb+srv://');
  }
  
  // Validar JWT secret em produção
  if (config.server.isProduction && config.auth.jwtSecret === 'seu_super_segredo_jwt_aqui_mude_em_producao') {
    errors.push('JWT_SECRET deve ser alterado em produção');
  }
  
  // Validar porta
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('PORT deve estar entre 1 e 65535');
  }
  
  if (errors.length > 0) {
    console.error('❌ Erros de validação de configuração:');
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  return true;
};

/**
 * Imprime resumo da configuração (apenas em desenvolvimento)
 */
export const printConfigSummary = () => {
  if (!isDevelopment()) return;
  
  console.log('\n📋 RESUMO DA CONFIGURAÇÃO:');
  console.log('==========================');
  console.log(`🌍 Ambiente: ${config.server.nodeEnv}`);
  console.log(`🚀 Servidor: ${config.server.host}:${config.server.port}`);
  console.log(`🗄️  Banco de dados: ${config.database.mongodbUri ? 'Configurado' : 'Não configurado'}`);
  console.log(`🔐 Autenticação: ${config.auth.jwtSecret ? 'JWT Configurado' : 'Não configurado'}`);
  console.log('==========================\n');
};

// Executar validação ao carregar
if (!validateConfig()) {
  process.exit(1);
}

// Imprimir resumo em desenvolvimento
printConfigSummary();

// Configurações padrão exportadas
export default config;

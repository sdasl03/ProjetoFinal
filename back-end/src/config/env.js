// config/env.js
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isDevelopment = nodeEnv === 'development';

const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv,
    isProduction,
    isDevelopment,
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/projeto_final',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutTime: parseInt(process.env.LOCKOUT_TIME || '900000'), // 15 minutes in ms
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@projetofinal.com',
  },
  file: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB in bytes
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};

export { isProduction, isDevelopment };
export default config;

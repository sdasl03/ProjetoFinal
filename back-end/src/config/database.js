// config/database.js (com GridFS)
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import config from './env.js';

// Variáveis globais para GridFS
let gfs;
let gridFSBucket;

const connectDB = async () => {
  try {
    if (!config.database.mongodbUri) {
      throw new Error('❌ MONGODB_URI não definida no arquivo .env');
    }

    const conn = await mongoose.connect(config.database.mongodbUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Configurar GridFS para upload de arquivos
    setupGridFS(conn.connection.db);

    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Configurar GridFS
const setupGridFS = (db) => {
  try {
    gridFSBucket = new GridFSBucket(db, {
      bucketName: 'uploads',
      chunkSizeBytes: 1024 * 255, // 255KB chunks
    });
    
    gfs = gridFSBucket;
    console.log('✅ GridFS configured for file uploads');
  } catch (error) {
    console.error(`❌ Error setting up GridFS: ${error.message}`);
  }
};

// Exportar GridFS bucket e utilitários
export const getGridFSBucket = () => gridFSBucket;
export const getGFS = () => gfs;

// Função para upload de arquivo
export const uploadFile = async (filename, buffer, metadata = {}) => {
  if (!gridFSBucket) {
    throw new Error('GridFS not initialized. Call connectDB first.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = gridFSBucket.openUploadStream(filename, {
      metadata,
    });

    uploadStream.write(buffer);
    uploadStream.end();

    uploadStream.on('finish', (file) => {
      resolve(file);
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });
  });
};

// Função para download de arquivo
export const downloadFile = async (fileId) => {
  if (!gridFSBucket) {
    throw new Error('GridFS not initialized. Call connectDB first.');
  }

  const chunks = [];
  return new Promise((resolve, reject) => {
    const downloadStream = gridFSBucket.openDownloadStream(fileId);

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    downloadStream.on('error', (error) => {
      reject(error);
    });
  });
};

export { mongoose };
export default connectDB;
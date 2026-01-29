// scripts/initModels.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as models from '../models/index.js';

dotenv.config();

const initModels = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Verificar se os modelos foram registrados
    console.log('\n📋 Registered Models:');
    Object.keys(mongoose.models).forEach(modelName => {
      console.log(`   • ${modelName}`);
    });

    // Verificar índices de cada modelo
    console.log('\n🔍 Checking indexes...');
    
    for (const [modelName, Model] of Object.entries(models)) {
      try {
        const indexes = await Model.collection.indexes();
        console.log(`\n   ${modelName}:`);
        indexes.forEach((index, i) => {
          if (i === 0) {
            console.log(`     • _id (default)`);
          } else {
            const keys = Object.keys(index.key).map(k => `${k}:${index.key[k]}`);
            console.log(`     • ${keys.join(', ')} ${index.unique ? '(unique)' : ''} ${index.name ? `[${index.name}]` : ''}`);
          }
        });
      } catch (error) {
        console.log(`   ${modelName}: No collection yet`);
      }
    }

    // Criar alguns dados de teste
    await createTestData();

    console.log('\n🎉 Models initialized successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error initializing models:', error);
    process.exit(1);
  }
};

const createTestData = async () => {
  console.log('\n🧪 Creating test data...');
  
  // Verificar se já existem dados
  const userCount = await models.User.countDocuments();
  
  if (userCount === 0) {
    console.log('   Creating test users...');
    
    // Criar um admin de teste
    const admin = await models.User.create({
      full_name: 'Admin Test',
      email: 'admin@test.edu',
      type: 'ADMIN',
      employee_number: 'ADM999',
      department: 'Test Department',
      auth_password_hash: 'test123', // Será hasheado pelo middleware
      permissions: ['all'],
    });
    
    console.log(`   ✅ Created admin: ${admin.email}`);
  } else {
    console.log(`   ${userCount} users already exist, skipping test data`);
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initModels();
}

export default initModels;
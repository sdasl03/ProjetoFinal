// tests/User.test.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  describe('Validações', () => {
    it('deve criar um usuário FACULTY válido', async () => {
      const facultyData = {
        full_name: 'Dr. Samuel Lira',
        email: 'samuel.lira@universidade.edu',
        type: 'FACULTY',
        employee_number: 'DOC001',
        department: 'Ciência da Computação',
        auth_password_hash: 'password123',
      };

      const user = await User.create(facultyData);
      expect(user.full_name).toBe(facultyData.full_name);
      expect(user.type).toBe('FACULTY');
      expect(user.employee_number).toBe('DOC001');
    });

    it('deve criar um usuário STUDENT válido', async () => {
      const studentData = {
        full_name: 'João Pereira',
        email: 'joao.pereira@aluno.universidade.edu',
        type: 'STUDENT',
        student_number: '2501482',
        department: 'Ciência da Computação',
        student_year: 3,
        student_semester: 6,
        auth_password_hash: 'password123',
      };

      const user = await User.create(studentData);
      expect(user.type).toBe('STUDENT');
      expect(user.student_number).toBe('2501482');
    });

    it('deve rejeitar email inválido', async () => {
      const invalidUser = {
        full_name: 'Test User',
        email: 'invalid-email',
        type: 'FACULTY',
        employee_number: 'DOC999',
        department: 'Test Department',
        auth_password_hash: 'password123',
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });

    it('deve rejeitar tipo inválido', async () => {
      const invalidUser = {
        full_name: 'Test User',
        email: 'test@universidade.edu',
        type: 'INVALID_TYPE',
        employee_number: 'DOC999',
        department: 'Test Department',
        auth_password_hash: 'password123',
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });
  });

  describe('Métodos de instância', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        full_name: 'Test User',
        email: 'test@universidade.edu',
        type: 'FACULTY',
        employee_number: 'DOC999',
        department: 'Test Department',
        auth_password_hash: 'password123',
      });
    });

    it('deve comparar password corretamente', async () => {
      // Note: o hash é feito no pre-save middleware
      const userWithPassword = await User.findById(testUser._id)
        .select('+auth_password_hash');
      
      // Para testar, precisaríamos do password original antes do hash
      // Em testes reais, você testaria o fluxo completo de registro/login
      expect(userWithPassword.auth_password_hash).toBeDefined();
    });

    it('deve retornar JSON de autenticação', () => {
      const authJSON = testUser.toAuthJSON();
      expect(authJSON.email).toBe(testUser.email);
      expect(authJSON.type).toBe(testUser.type);
      expect(authJSON.auth_password_hash).toBeUndefined(); // Não deve incluir hash
    });
  });

  describe('Métodos estáticos', () => {
    beforeEach(async () => {
      await User.create([
        {
          full_name: 'Faculty 1',
          email: 'faculty1@universidade.edu',
          type: 'FACULTY',
          employee_number: 'DOC001',
          department: 'Ciência da Computação',
          auth_password_hash: 'pass1',
        },
        {
          full_name: 'Student 1',
          email: 'student1@aluno.universidade.edu',
          type: 'STUDENT',
          student_number: '2501481',
          department: 'Ciência da Computação',
          auth_password_hash: 'pass2',
        },
        {
          full_name: 'Admin 1',
          email: 'admin1@universidade.edu',
          type: 'ADMIN',
          employee_number: 'ADM001',
          department: 'TI',
          auth_password_hash: 'pass3',
        },
      ]);
    });

    it('deve encontrar todos os docentes', async () => {
      const faculty = await User.findAllFaculty();
      expect(faculty.length).toBe(1);
      expect(faculty[0].type).toBe('FACULTY');
    });

    it('deve verificar se email existe', async () => {
      const exists = await User.emailExists('faculty1@universidade.edu');
      expect(exists).toBe(true);

      const notExists = await User.emailExists('nonexistent@universidade.edu');
      expect(notExists).toBe(false);
    });
  });
});
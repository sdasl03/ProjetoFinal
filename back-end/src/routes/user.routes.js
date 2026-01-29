// routes/user.routes.js
import express from 'express';
import User from '../models/User.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse
} from '../utils/response.js';
import { authenticate, authorize, hasPermission } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
//router.use(authenticate);

/**
 * @route   GET /api/users/faculty
 * @desc    Listar todos os docentes (para seleção em propostas)
 * @access  Private
 */
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await User.find({ 
      type: 'FACULTY', 
      active: true 
    })
    .select('full_name email department employee_number')
    .sort('full_name');

    return successResponse(res, { faculty }, 'Docentes listados com sucesso');

  } catch (error) {
    console.error('List faculty error:', error);
    return errorResponse(res, 'Erro ao listar docentes', 500);
  }
});


/**
 * @route   GET /api/users
 * @desc    Listar utilizadores (com filtros)
 * @access  Private (Admin/Faculty)
 */
router.get('/', authenticate, authorize('ADMIN', 'FACULTY'), async (req, res) => {
  try {
    const { 
      type, 
      department, 
      active, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    // Construir query
    const query = {};

    // Filtros
    if (type) query.type = type;
    if (department) query.department = department;
    if (active !== undefined) query.active = active === 'true';

    // Busca por nome ou email
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Executar query com paginação
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-auth_password_hash')
        .sort({ full_name: 1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    // Estatísticas
    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    }, 'Utilizadores listados com sucesso');

  } catch (error) {
    console.error('List users error:', error);
    return errorResponse(res, 'Erro ao listar utilizadores', 500);
  }
});


/**
 * @route   GET /api/users/students
 * @desc    Listar todos os alunos
 * @access  Private (Admin/Faculty)
 */
router.get('/students', authenticate, authorize('ADMIN', 'FACULTY'), async (req, res) => {
  try {
    const { department, year } = req.query;
    const query = { type: 'STUDENT', active: true };

    if (department) query.department = department;
    if (year) query.student_year = parseInt(year);

    const students = await User.find(query)
      .select('full_name email department student_number student_year student_semester')
      .sort('full_name');

    return successResponse(res, { students }, 'Alunos listados com sucesso');

  } catch (error) {
    console.error('List students error:', error);
    return errorResponse(res, 'Erro ao listar alunos', 500);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Obter detalhes de um utilizador
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar permissões
    if (req.user.type !== 'ADMIN' && req.user._id.toString() !== userId) {
      return forbiddenResponse(res, 'Não tem permissão para ver este utilizador');
    }

    const user = await User.findById(userId).select('-auth_password_hash');

    if (!user) {
      return notFoundResponse(res, 'Utilizador');
    }

    return successResponse(res, { user }, 'Utilizador encontrado');

  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 'Erro ao obter utilizador', 500);
  }
});

/**
 * @route   POST /api/users
 * @desc    Criar novo utilizador (apenas Admin)
 * @access  Private (Admin)
 */
router.post('/', authenticate, authorize('ADMIN'), hasPermission('users:create'), async (req, res) => {
  try {
    const { 
      full_name, 
      email, 
      type, 
      department, 
      student_number, 
      employee_number,
      permissions,
      active = true 
    } = req.body;

    // Validações básicas
    if (!full_name || !email || !type || !department) {
      return errorResponse(res, 'Campos obrigatórios em falta', 400);
    }

    // Verificar email único
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictResponse(res, 'Email já registado');
    }

    // Verificar student_number/employee_number conforme tipo
    let userData = {
      full_name,
      email,
      type,
      department,
      active,
      auth_password_hash: 'TemporaryPassword123!', // Password temporária
    };

    if (type === 'STUDENT') {
      if (!student_number) {
        return errorResponse(res, 'Número de estudante é obrigatório', 400);
      }
      userData.student_number = student_number;
    } else {
      if (!employee_number) {
        return errorResponse(res, 'Número de funcionário é obrigatório', 400);
      }
      userData.employee_number = employee_number;
    }

    if (permissions && Array.isArray(permissions)) {
      userData.permissions = permissions;
    }

    const user = await User.create(userData);

    // Em produção, enviar email com instruções para definir password

    return successResponse(
      res, 
      { user: user.toAuthJSON() }, 
      'Utilizador criado com sucesso', 
      201
    );

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao criar utilizador', 500);
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Atualizar utilizador
 * @access  Private (Admin ou próprio utilizador)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Verificar permissões
    if (req.user.type !== 'ADMIN' && req.user._id.toString() !== userId) {
      return forbiddenResponse(res, 'Não tem permissão para atualizar este utilizador');
    }

    // Utilizadores não-admin não podem atualizar certos campos
    if (req.user.type !== 'ADMIN') {
      delete updates.type;
      delete updates.permissions;
      delete updates.active;
      delete updates.employee_number;
      delete updates.student_number;
    }

    // Admin não pode desativar a si mesmo
    if (updates.active === false && userId === req.user._id.toString()) {
      return forbiddenResponse(res, 'Não pode desativar a sua própria conta');
    }

    // Remover campos que não devem ser atualizados diretamente
    delete updates.auth_password_hash;
    delete updates.email; // Email requer processo separado

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-auth_password_hash');

    if (!user) {
      return notFoundResponse(res, 'Utilizador');
    }

    return successResponse(res, { user }, 'Utilizador atualizado com sucesso');

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return validationErrorResponse(res, errors);
    }
    
    return errorResponse(res, 'Erro ao atualizar utilizador', 500);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Desativar utilizador (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), hasPermission('users:delete'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Não pode desativar a si mesmo
    if (userId === req.user._id.toString()) {
      return forbiddenResponse(res, 'Não pode desativar a sua própria conta');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { active: false } },
      { new: true }
    ).select('-auth_password_hash');

    if (!user) {
      return notFoundResponse(res, 'Utilizador');
    }

    return successResponse(res, { user }, 'Utilizador desativado com sucesso');

  } catch (error) {
    console.error('Deactivate user error:', error);
    return errorResponse(res, 'Erro ao desativar utilizador', 500);
  }
});

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Ativar utilizador
 * @access  Private (Admin)
 */
router.put('/:id/activate', authenticate, authorize('ADMIN'), hasPermission('users:update'), async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { active: true } },
      { new: true }
    ).select('-auth_password_hash');

    if (!user) {
      return notFoundResponse(res, 'Utilizador');
    }

    return successResponse(res, { user }, 'Utilizador ativado com sucesso');

  } catch (error) {
    console.error('Activate user error:', error);
    return errorResponse(res, 'Erro ao ativar utilizador', 500);
  }
});

/**
 * @route   GET /api/users/:id/stats
 * @desc    Obter estatísticas de um utilizador
 * @access  Private
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar permissões
    if (req.user.type !== 'ADMIN' && req.user._id.toString() !== userId) {
      return forbiddenResponse(res, 'Não tem permissão para ver estas estatísticas');
    }

    // Aqui você pode adicionar estatísticas específicas
    // Por exemplo: número de propostas criadas, etc.
    
    const stats = {
      user_id: userId,
      last_login: req.user.last_login,
      registration_date: req.user.registration_date,
      // Adicionar mais estatísticas conforme necessário
    };

    return successResponse(res, { stats }, 'Estatísticas obtidas com sucesso');

  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, 'Erro ao obter estatísticas', 500);
  }
});

export default router;
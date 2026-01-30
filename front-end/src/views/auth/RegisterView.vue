<template>
  <div class="register">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="register-card card shadow">
            <div class="card-body p-5">
              <!-- Header -->
              <div class="text-center mb-4">
                <h2 class="card-title mb-2">Criar Conta</h2>
                <p class="text-muted">Registe-se no sistema de gestão de projetos</p>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {{ errorMessage }}
              </div>

              <!-- Success Message -->
              <div v-if="successMessage" class="alert alert-success" role="alert">
                <i class="bi bi-check-circle me-2"></i>
                {{ successMessage }}
              </div>

              <!-- Register Form -->
              <form @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label for="full_name" class="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="full_name"
                    v-model="form.full_name"
                    required
                    placeholder="Ex: Professor Teste"
                    :class="{ 'is-invalid': errors.full_name }"
                  >
                  <div v-if="errors.full_name" class="invalid-feedback">
                    {{ errors.full_name }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email *</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    v-model="form.email"
                    required
                    placeholder="exemplo@universidade.edu"
                    :class="{ 'is-invalid': errors.email }"
                  >
                  <div v-if="errors.email" class="invalid-feedback">
                    {{ errors.email }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="type" class="form-label">Tipo de Utilizador *</label>
                  <select
                    class="form-select"
                    id="type"
                    v-model="form.type"
                    required
                    :class="{ 'is-invalid': errors.type }"
                    @change="onTypeChange"
                  >
                    <option value="">Selecione um tipo</option>
                    <option value="STUDENT">Estudante</option>
                    <option value="FACULTY">Professor</option>
                  </select>
                  <div v-if="errors.type" class="invalid-feedback">
                    {{ errors.type }}
                  </div>
                </div>

                <!-- Student specific field -->
                <div v-if="form.type === 'STUDENT'" class="mb-3">
                  <label for="student_number" class="form-label">Número de Estudante *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="student_number"
                    v-model="form.student_number"
                    required
                    placeholder="Ex: 2501482"
                    :class="{ 'is-invalid': errors.student_number }"
                  >
                  <div v-if="errors.student_number" class="invalid-feedback">
                    {{ errors.student_number }}
                  </div>
                </div>

                <!-- Faculty specific field -->
                <div v-if="form.type === 'FACULTY'" class="mb-3">
                  <label for="employee_number" class="form-label">Número de Funcionário *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="employee_number"
                    v-model="form.employee_number"
                    required
                    placeholder="Ex: DOC123"
                    :class="{ 'is-invalid': errors.employee_number }"
                  >
                  <div v-if="errors.employee_number" class="invalid-feedback">
                    {{ errors.employee_number }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="department" class="form-label">Departamento *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="department"
                    v-model="form.department"
                    required
                    placeholder="Ex: Ciência da Computação"
                    :class="{ 'is-invalid': errors.department }"
                  >
                  <div v-if="errors.department" class="invalid-feedback">
                    {{ errors.department }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password *</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    v-model="form.password"
                    required
                    :class="{ 'is-invalid': errors.password }"
                  >
                  <div v-if="errors.password" class="invalid-feedback">
                    {{ errors.password }}
                  </div>
                  <div class="form-text">
                    Deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos
                  </div>
                </div>

                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar Password *</label>
                  <input
                    type="password"
                    class="form-control"
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    required
                    :class="{ 'is-invalid': errors.confirmPassword }"
                  >
                  <div v-if="errors.confirmPassword" class="invalid-feedback">
                    {{ errors.confirmPassword }}
                  </div>
                </div>

                <div class="mb-3 form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="terms"
                    v-model="form.acceptTerms"
                    required
                    :class="{ 'is-invalid': errors.acceptTerms }"
                  >
                  <label class="form-check-label" for="terms">
                    Aceito os <a href="#" @click.prevent>termos de uso</a> e <a href="#" @click.prevent>política de privacidade</a>
                  </label>
                  <div v-if="errors.acceptTerms" class="invalid-feedback d-block">
                    {{ errors.acceptTerms }}
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100 mb-3"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <i v-else class="bi bi-person-plus me-2"></i>
                  {{ loading ? 'A criar conta...' : 'Criar Conta' }}
                </button>
              </form>

              <!-- Login Link -->
              <div class="text-center">
                <p class="mb-0">
                  Já tem uma conta?
                  <router-link to="/login" class="text-decoration-none fw-bold">
                    Faça login aqui
                  </router-link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { authApi } from '@/api/auth';

export default {
  name: 'RegisterView',
  data() {
    return {
      form: {
        full_name: '',
        email: '',
        type: '',
        student_number: '',
        employee_number: '',
        department: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
      },
      errors: {},
      loading: false,
      errorMessage: '',
      successMessage: '',
    };
  },
  methods: {
    onTypeChange() {
      // Clear role-specific fields when type changes
      if (this.form.type === 'STUDENT') {
        this.form.employee_number = '';
      } else if (this.form.type === 'FACULTY') {
        this.form.student_number = '';
      }
    },

    async handleSubmit() {
      // Reset messages
      this.errors = {};
      this.errorMessage = '';
      this.successMessage = '';
      this.loading = true;

      try {
        // Validate form
        this.validateForm();

        // Prepare data EXACTLY as backend expects
        const userData = {
          full_name: this.form.full_name,
          email: this.form.email,
          password: this.form.password,
          type: this.form.type,
          department: this.form.department,
        };

        // Add role-specific field
        if (this.form.type === 'STUDENT') {
          userData.student_number = this.form.student_number;
        } else if (this.form.type === 'FACULTY') {
          userData.employee_number = this.form.employee_number;
        }

        console.log('Sending registration data:', userData);

        // Call API
        const response = await authApi.register(userData);
        console.log('Registration response:', response.data);

        // Success
        this.successMessage = 'Conta criada com sucesso! Redirecionando para login...';

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.$router.push({
            path: '/login',
            query: { 
              registered: 'success', 
              email: this.form.email,
              message: 'Conta criada com sucesso! Faça login.'
            }
          });
        }, 3000);

      } catch (error) {
        console.error('Registration error details:', error);
        
        // Log full error for debugging
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          console.error('Response headers:', error.response.headers);
        }
        
        // Handle different error types
        if (error.response?.status === 409) {
          this.errorMessage = 'Este email já está registado.';
        } else if (error.response?.data?.error) {
          this.errorMessage = error.response.data.error;
        } else if (error.response?.data?.errors) {
          // Handle validation errors from server
          this.errors = { ...this.errors, ...error.response.data.errors };
          this.errorMessage = 'Por favor, corrija os erros no formulário.';
        } else if (error.message === 'Form validation failed') {
          // Client-side validation failed
          this.errorMessage = 'Por favor, corrija os erros no formulário.';
        } else if (error.code === 'ERR_NETWORK') {
          this.errorMessage = 'Erro de conexão. Verifique se o servidor está em execução.';
        } else {
          this.errorMessage = 'Erro ao criar conta. Tente novamente.';
        }
      } finally {
        this.loading = false;
      }
    },

    validateForm() {
      const newErrors = {};

      // Full name validation
      if (!this.form.full_name.trim()) {
        newErrors.full_name = 'Nome completo é obrigatório';
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email) {
        newErrors.email = 'Email é obrigatório';
      } else if (!emailRegex.test(this.form.email)) {
        newErrors.email = 'Email inválido';
      }

      // Type validation
      if (!this.form.type) {
        newErrors.type = 'Tipo de utilizador é obrigatório';
      }

      // Student number validation
      if (this.form.type === 'STUDENT' && !this.form.student_number) {
        newErrors.student_number = 'Número de estudante é obrigatório';
      }

      // Employee number validation
      if (this.form.type === 'FACULTY' && !this.form.employee_number) {
        newErrors.employee_number = 'Número de funcionário é obrigatório';
      }

      // Department validation
      if (!this.form.department) {
        newErrors.department = 'Departamento é obrigatório';
      }

      // Password validation
      if (!this.form.password) {
        newErrors.password = 'Password é obrigatória';
      } else if (this.form.password.length < 8) {
        newErrors.password = 'Password deve ter pelo menos 8 caracteres';
      } else {
        // Check password strength (matching your backend requirements)
        const hasUpperCase = /[A-Z]/.test(this.form.password);
        const hasLowerCase = /[a-z]/.test(this.form.password);
        const hasNumbers = /\d/.test(this.form.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.form.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
          newErrors.password = 'Password deve conter maiúsculas, minúsculas, números e símbolos';
        }
      }

      // Confirm password
      if (!this.form.confirmPassword) {
        newErrors.confirmPassword = 'Confirmação de password é obrigatória';
      } else if (this.form.password !== this.form.confirmPassword) {
        newErrors.confirmPassword = 'Passwords não coincidem';
      }

      // Terms validation
      if (!this.form.acceptTerms) {
        newErrors.acceptTerms = 'Deve aceitar os termos de uso';
      }

      // Update errors
      this.errors = newErrors;

      // Throw error if any validation failed
      if (Object.keys(newErrors).length > 0) {
        throw new Error('Form validation failed');
      }
    },
  },
};
</script>

<style scoped>
.register {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.register-card {
  border: none;
  border-radius: 15px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.98);
}

.card-title {
  color: #333;
  font-weight: 600;
}

.form-label {
  font-weight: 500;
  color: #555;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .register {
    padding: 1rem 0;
  }

  .register-card .card-body {
    padding: 2rem !important;
  }
}

.alert {
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
}

.spinner-border {
  vertical-align: middle;
}

.form-text {
  font-size: 0.85rem;
  color: #6c757d;
}
</style>
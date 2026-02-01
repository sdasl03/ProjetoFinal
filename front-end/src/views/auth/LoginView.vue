<!-- src/views/auth/LoginView.vue -->
<template>
  <div class="login-view">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow border-0 mt-5">
            <div class="card-body p-4">
              <!-- Header -->
              <div class="text-center mb-4">
                <i class="fas fa-graduation-cap fa-3x text-primary mb-3"></i>
                <h2 class="h3 mb-3">Entrar no Sistema</h2>
                <p class="text-muted">
                  Aceda à plataforma de gestão de propostas
                </p>
              </div>
              
              <!-- Login Form -->
              <form @submit.prevent="handleLogin">
                <!-- Email -->
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="fas fa-envelope"></i>
                    </span>
                    <input
                      v-model="form.email"
                      type="email"
                      class="form-control"
                      id="email"
                      placeholder="seu.email@universidade.edu"
                      required
                    />
                  </div>
                </div>
                
                <!-- Password -->
                <div class="mb-4">
                  <label for="password" class="form-label">Password</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
                      id="password"
                      placeholder="********"
                      required
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>
                
                <!-- Submit Button -->
                <button
                  type="submit"
                  class="btn btn-primary w-100 py-2 mb-3"
                  :disabled="loading"
                >
                  <template v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    A processar...
                  </template>
                  <template v-else>
                    <i class="fas fa-sign-in-alt me-2"></i>
                    Entrar
                  </template>
                </button>
                
                <!-- Error Message -->
                <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  {{ error }}
                  <button type="button" class="btn-close" @click="error = ''"></button>
                </div>
                
                <!-- Links -->
                <div class="text-center mt-4">
                  <p class="mb-2">
                    Não tem conta?
                    <router-link to="/register" class="text-decoration-none">
                      <strong>Registe-se aqui</strong>
                    </router-link>
                  </p>
                  <router-link to="/" class="text-decoration-none">
                    <i class="fas fa-home me-1"></i>
                    Voltar à página inicial
                  </router-link>
                </div>
              </form>
            </div>
          </div>
          
          <!-- Demo Credentials (for development only) -->
          <div v-if="isDevelopment" class="card bg-light mt-3">
            <div class="card-body">
              <h6 class="card-title">
                <i class="fas fa-vial me-2"></i>Credenciais de Teste
              </h6>
              <p class="small mb-1">
                <strong>Professor:</strong> professor.teste@universidade.edu / Teste123!
              </p>
              <p class="small mb-0">
                <strong>Aluno:</strong> aluno.teste@universidade.edu / Aluno123!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'LoginView',
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      showPassword: false,
      loading: false,
      error: '',
    };
  },
  computed: {
    isDevelopment() {
      return process.env.NODE_ENV === 'development';
    },
  },
  methods: {
    ...mapActions('auth', ['login']),
    
    async handleLogin() {
      this.loading = true;
      this.error = '';
      
      try {
        const result = await this.login(this.form);
        
        if (result.success) {
          // Redirect to proposals or intended page
          const redirect = this.$route.query.redirect;
          this.$router.push(redirect || '/proposals');
        } else {
          this.error = result.error || 'Credenciais inválidas. Tente novamente.';
        }
      } catch (err) {
        console.error('Login error:', err);
        this.error = 'Erro ao conectar com o servidor. Tente novamente.';
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    // Pre-fill demo credentials in development
    if (this.isDevelopment) {
      this.form.email = 'professor.teste@universidade.edu';
      this.form.password = 'Teste123!';
    }
  },
};
</script>

<style scoped>
.login-view {
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.card {
  border-radius: 10px;
}

.input-group-text {
  background-color: #f8f9fa;
}
</style>
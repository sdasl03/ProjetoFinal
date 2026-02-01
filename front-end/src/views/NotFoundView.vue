<template>
  <div class="not-found">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <div class="error-content">
            <div class="error-icon mb-4">
              <i class="bi bi-exclamation-triangle-fill text-warning fs-1"></i>
            </div>

            <h1 class="display-1 fw-bold text-primary mb-3">404</h1>

            <h2 class="mb-4">Página não encontrada</h2>

            <p class="lead text-muted mb-4">
              A página que você está procurando não existe ou foi movida.
            </p>

            <div class="d-flex justify-content-center gap-3">
              <router-link to="/" class="btn btn-primary btn-lg">
                <i class="bi bi-house me-2"></i>
                Ir para Início
              </router-link>

              <router-link
                v-if="isAuthenticated"
                to="/"
                class="btn btn-outline-primary btn-lg"
              >
                <i class="bi bi-speedometer2 me-2"></i>
                Home
              </router-link>

              <button
                @click="goBack"
                class="btn btn-outline-secondary btn-lg"
              >
                <i class="bi bi-arrow-left me-2"></i>
                Voltar
              </button>
            </div>

            <div class="mt-5">
              <p class="text-muted small">
                Se você acredita que isso é um erro, entre em contato com o administrador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'NotFoundView',
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
  },
  mounted() {
    // Track 404 errors for analytics
    console.log('404 Error - Path:', this.$route.path);
  },
};
</script>

<style scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  padding: 2rem 0;
}

.error-content {
  padding: 3rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.error-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.display-1 {
  font-size: 8rem;
  line-height: 1;
}

@media (max-width: 768px) {
  .error-content {
    padding: 2rem;
  }

  .display-1 {
    font-size: 6rem;
  }

  .d-flex {
    flex-direction: column;
    align-items: center;
  }

  .btn-lg {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
<template>
  <div class="home">
    <!-- Hero Section - Centered -->
    <section class="hero-section bg-primary text-white">
      <div class="container d-flex align-items-center justify-content-center min-vh-60">
        <div class="row justify-content-center text-center">
          <div class="col-lg-8 col-xl-7">
            <h1 class="display-4 fw-bold mb-4">
              Sistema de Gestão de Propostas Finais
            </h1>
            <p class="lead mb-4 px-lg-5">
              Uma plataforma completa para gestão de propostas de projetos finais,
              conectando estudantes, professores e coordenadores em um ambiente colaborativo.
            </p>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <router-link
                v-if="!isAuthenticated"
                to="/register"
                class="btn btn-light btn-lg px-4"
              >
                <i class="bi bi-person-plus me-2"></i>
                Registar
              </router-link>
              <router-link
                v-if="!isAuthenticated"
                to="/login"
                class="btn btn-outline-light btn-lg px-4"
              >
                <i class="bi bi-box-arrow-in-right me-2"></i>
                Entrar
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-5">
      <div class="container">
        <h2 class="text-center mb-5 display-5 fw-semibold">Funcionalidades</h2>
        <div class="row justify-content-center">
          <div class="col-lg-5 col-xl-4 mb-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center p-4">
                <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                  <i class="bi bi-people-fill fs-1 text-primary"></i>
                </div>
                <h4 class="card-title mb-3">Gestão de Professores</h4>
                <p class="card-text text-muted">
                  Consulte a lista completa de professores e coordenadores disponíveis para orientação de projetos.
                </p>
                <router-link to="/faculty" class="btn btn-outline-primary mt-2">
                  Ver Professores
                </router-link>
              </div>
            </div>
          </div>
          
          <div class="col-lg-5 col-xl-4 mb-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center p-4">
                <div class="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                  <i class="bi bi-folder-plus fs-1 text-success"></i>
                </div>
                <h4 class="card-title mb-3">Submissão de Propostas</h4>
                <p class="card-text text-muted">
                  Submeta e acompanhe as suas propostas de projeto de forma simples e organizada.
                </p>
                <router-link 
                  v-if="isAuthenticated" 
                  to="/proposals/create" 
                  class="btn btn-outline-success mt-2"
                >
                  Nova Proposta
                </router-link>
                <router-link 
                  v-else 
                  to="/login" 
                  class="btn btn-outline-success mt-2"
                >
                  Entrar para Submeter
                </router-link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section v-if="!isAuthenticated" class="py-5 bg-light">
      <div class="container text-center">
        <h2 class="mb-4">Pronto para Começar?</h2>
        <p class="lead mb-4">
          Junte-se à nossa plataforma e simplifique a gestão dos seus projetos académicos.
        </p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <router-link to="/register" class="btn btn-primary btn-lg px-4">
            <i class="bi bi-person-plus me-2"></i>
            Criar Conta
          </router-link>
          <router-link to="/faculty" class="btn btn-outline-primary btn-lg px-4">
            <i class="bi bi-people me-2"></i>
            Ver Professores
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'HomeView',
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'currentUser']),
  },
  mounted() {
    this.loadStats();
  },
  methods: {
    async loadStats() {
      try {
        // This would load actual stats from the API
        // For now, just placeholder data
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },
  },
};
</script>

<style scoped>
.hero-section {
  min-height: 70vh;
  position: relative;
  overflow: hidden;
}

.min-vh-60 {
  min-height: 60vh;
}

/* Optional: Add a subtle background pattern */
.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 20%),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 20%);
  pointer-events: none;
}

.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05);
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-section {
    min-height: 60vh;
    padding: 4rem 0;
  }
  
  .display-4 {
    font-size: 2.2rem;
  }
  
  .lead {
    font-size: 1.1rem;
  }
  
  .btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 576px) {
  .hero-section {
    padding: 3rem 0;
  }
  
  .display-4 {
    font-size: 1.8rem;
  }
  
  .lead {
    font-size: 1rem;
  }
  
  .d-flex.gap-3 {
    gap: 1rem !important;
  }
  
  .btn-lg {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
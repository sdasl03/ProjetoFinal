<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero-section bg-primary text-white py-5">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <h1 class="display-4 fw-bold mb-4">
              Sistema de Gestão de Propostas Finais
            </h1>
            <p class="lead mb-4">
              Uma plataforma completa para gestão de propostas de projetos finais,
              conectando estudantes, professores e coordenadores em um ambiente colaborativo.
            </p>
            <div class="d-flex gap-3">
              <router-link
                v-if="!isAuthenticated"
                to="/register"
                class="btn btn-light btn-lg"
              >
                <i class="bi bi-person-plus me-2"></i>
                Registar
              </router-link>
              <router-link
                v-if="!isAuthenticated"
                to="/login"
                class="btn btn-outline-light btn-lg"
              >
                <i class="bi bi-box-arrow-in-right me-2"></i>
                Entrar
              </router-link>
              <router-link
                v-if="isAuthenticated"
                to="/dashboard"
                class="btn btn-light btn-lg"
              >
                <i class="bi bi-speedometer2 me-2"></i>
                Dashboard
              </router-link>
            </div>
          </div>
          <div class="col-lg-6">
            <img
              src="@/assets/images/hero-illustration.svg"
              alt="Sistema de Gestão"
              class="img-fluid"
              onerror="this.style.display='none'"
            >
          </div>
        </div>
      </div>
    </section>

    <section class="stats-section bg-light py-5">
      <div class="container">
        <div class="row text-center">
          <div class="col-md-3 mb-4">
            <div class="stat-item">
              <h3 class="display-4 fw-bold text-primary mb-2">{{ stats.totalProposals }}</h3>
              <p class="text-muted mb-0">Propostas Criadas</p>
            </div>
          </div>
          <div class="col-md-3 mb-4">
            <div class="stat-item">
              <h3 class="display-4 fw-bold text-success mb-2">{{ stats.activeStudents }}</h3>
              <p class="text-muted mb-0">Estudantes Ativos</p>
            </div>
          </div>
          <div class="col-md-3 mb-4">
            <div class="stat-item">
              <h3 class="display-4 fw-bold text-warning mb-2">{{ stats.facultyMembers }}</h3>
              <p class="text-muted mb-0">Professores</p>
            </div>
          </div>
          <div class="col-md-3 mb-4">
            <div class="stat-item">
              <h3 class="display-4 fw-bold text-info mb-2">{{ stats.completedProjects }}</h3>
              <p class="text-muted mb-0">Projetos Concluídos</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section bg-primary text-white py-5">
      <div class="container text-center">
        <h2 class="display-5 fw-bold mb-3">Pronto para começar?</h2>
        <p class="lead mb-4">
          Junte-se à nossa comunidade e comece a gerenciar suas propostas hoje mesmo.
        </p>
        <router-link
          v-if="!isAuthenticated"
          to="/register"
          class="btn btn-light btn-lg px-4"
        >
          <i class="bi bi-rocket me-2"></i>
          Começar Agora
        </router-link>
        <router-link
          v-if="isAuthenticated"
          to="/dashboard"
          class="btn btn-light btn-lg px-4"
        >
          <i class="bi bi-arrow-right me-2"></i>
          Ir para Dashboard
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'HomeView',
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
    stats() {
      return {
        totalProposals: 0,
        activeStudents: 0,
        facultyMembers: 0,
        completedProjects: 0,
      };
    },
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
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.feature-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

.feature-icon {
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

.stat-item h3 {
  font-size: 2.5rem;
}

.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

@media (max-width: 768px) {
  .hero-section {
    text-align: center;
    padding: 3rem 0;
  }

  .display-4 {
    font-size: 2.5rem;
  }
}
</style>
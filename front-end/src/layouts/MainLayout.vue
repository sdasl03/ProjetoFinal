<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="main-layout">
    <header class="header">
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <router-link to="/" class="navbar-brand">
            <i class="fas fa-graduation-cap me-2"></i>
            {{ appName }}
          </router-link>
          
          <button class="navbar-toggler" type="button" @click="toggleMenu">
            <span class="navbar-toggler-icon"></span>
          </button>
          
          <div :class="['navbar-collapse', { show: menuOpen }]" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <!-- Public Navigation -->
              <li class="nav-item">
                <router-link to="/faculty" class="nav-link">
                  <i class="fas fa-users me-1"></i> Docentes
                </router-link>
              </li>
              
              <!-- Authenticated Navigation -->
              <template v-if="isAuthenticated">
                <li class="nav-item">
                  <router-link to="/proposals" class="nav-link">
                    <i class="fas fa-file-alt me-1"></i> Propostas
                  </router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/dashboard" class="nav-link">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </router-link>
                </li>
                
                <!-- User Dropdown -->
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" @click="toggleDropdown">
                    <i class="fas fa-user-circle me-1"></i> {{ userFullName }}
                  </a>
                  <ul :class="['dropdown-menu', { show: dropdownOpen }]">
                    <li>
                      <router-link to="/profile" class="dropdown-item">
                        <i class="fas fa-user me-2"></i> Meu Perfil
                      </router-link>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button @click="logout" class="dropdown-item text-danger">
                        <i class="fas fa-sign-out-alt me-2"></i> Sair
                      </button>
                    </li>
                  </ul>
                </li>
              </template>
              
              <!-- Guest Navigation -->
              <template v-else>
                <li class="nav-item">
                  <router-link to="/login" class="nav-link">
                    <i class="fas fa-sign-in-alt me-1"></i> Entrar
                  </router-link>
                </li>
                <li class="nav-item">
                  <router-link to="/register" class="btn btn-light ms-2">
                    <i class="fas fa-user-plus me-1"></i> Registar
                  </router-link>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </nav>
    </header>
    
    <main class="main-content">
      <div class="container py-4">
        <router-view />
      </div>
    </main>
    
    <footer class="footer bg-dark text-white py-4">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h5>{{ appName }}</h5>
            <p>Sistema de gestão de propostas de projetos finais</p>
          </div>
          <div class="col-md-6 text-md-end">
            <p class="mb-0">&copy; {{ currentYear }} Universidade</p>
            <p class="small">Desenvolvido para gestão académica</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'MainLayout',
  data() {
    return {
      appName: process.env.VUE_APP_NAME || 'Gestão de Projetos',
      menuOpen: false,
      dropdownOpen: false,
    };
  },
  computed: {
    ...mapState('auth', ['isAuthenticated', 'user']),
    ...mapGetters('auth', ['userFullName']),
    currentYear() {
      return new Date().getFullYear();
    },
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },
    logout() {
      this.$store.dispatch('auth/logout');
    },
  },
  mounted() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!this.$el.contains(event.target)) {
        this.dropdownOpen = false;
        this.menuOpen = false;
      }
    });
  },
};
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.navbar-brand {
  font-weight: 600;
  font-size: 1.25rem;
}

.footer {
  margin-top: auto;
}
</style>
<!-- src/views/faculty/FacultyListView.vue -->
<template>
  <div class="faculty-list-view">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <h1 class="display-5">
        <i class="fas fa-chalkboard-teacher text-primary me-2"></i>
        Lista de Docentes
      </h1>
      <p class="lead">
        Consulte a lista de docentes disponíveis para orientação de projetos finais.
        <span class="text-muted">(Acesso público)</span>
      </p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">A carregar...</span>
      </div>
      <p class="mt-3">A carregar lista de docentes...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong>Erro!</strong> {{ error }}
      <button @click="loadFaculty" class="btn btn-sm btn-outline-danger ms-3">
        <i class="fas fa-redo me-1"></i> Tentar novamente
      </button>
    </div>
    
    <!-- Success State -->
    <div v-else>
      <!-- Stats -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="card-title">
                <i class="fas fa-users me-2"></i> Total Docentes
              </h5>
              <p class="display-4 mb-0">{{ facultyList.length }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Faculty Grid -->
      <div class="row">
        <div v-for="faculty in facultyList" :key="faculty._id" class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <div class="faculty-avatar me-3">
                  <i class="fas fa-user-circle fa-3x text-primary"></i>
                </div>
                <div>
                  <h5 class="card-title mb-0">{{ faculty.full_name }}</h5>
                  <p class="card-text text-muted small">
                    <i class="fas fa-id-card me-1"></i> {{ faculty.employee_number }}
                  </p>
                </div>
              </div>
              
              <div class="faculty-details">
                <p class="mb-2">
                  <i class="fas fa-building me-2 text-secondary"></i>
                  <strong>Departamento:</strong> {{ faculty.department }}
                </p>
                <p class="mb-0">
                  <i class="fas fa-envelope me-2 text-secondary"></i>
                  <strong>Email:</strong>
                  <a :href="`mailto:${faculty.email}`" class="text-decoration-none">
                    {{ faculty.email }}
                  </a>
                </p>
              </div>
            </div>
            
            <div class="card-footer bg-transparent">
              <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Disponível para orientação de projetos
              </small>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="facultyList.length === 0" class="text-center py-5">
        <i class="fas fa-users fa-4x text-muted mb-3"></i>
        <h4>Nenhum docente encontrado</h4>
        <p class="text-muted">Não há docentes registados no sistema.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { usersApi } from '@/api/users';

export default {
  name: 'FacultyListView',
  data() {
    return {
      facultyList: [],
      loading: true,
      error: '',
    };
  },
  mounted() {
    this.loadFaculty();
  },
  methods: {
    async loadFaculty() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await usersApi.getFaculty();
        this.facultyList = response.data.data.faculty;
      } catch (err) {
        console.error('Error fetching faculty:', err);
        this.error = err.response?.data?.error || 'Erro ao carregar lista de docentes. Tente novamente.';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.faculty-list-view {
  min-height: 70vh;
}

.faculty-avatar {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}
</style>
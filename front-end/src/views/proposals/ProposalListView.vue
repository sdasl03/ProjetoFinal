<template>
  <div class="proposals-list">
    <div class="container-fluid">
      <!-- Header -->
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="mb-0">
              <i class="bi bi-file-earmark-text me-2"></i>
              Propostas
            </h1>
            <div class="d-flex gap-2">
              <button
                @click="refreshProposals"
                class="btn btn-outline-secondary"
                :disabled="loading"
              >
                <i class="bi bi-arrow-clockwise me-2"></i>
                Atualizar
              </button>
              <router-link
                to="/proposals/create"
                class="btn btn-primary"
              >
                <i class="bi bi-plus-circle me-2"></i>
                Nova Proposta
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <label for="statusFilter" class="form-label">Status</label>
                  <select
                    id="statusFilter"
                    class="form-select"
                    v-model="filters.status"
                    @change="applyFilters"
                  >
                    <option value="">Todos</option>
                    <option value="draft">Rascunho</option>
                    <option value="submitted">Submetida</option>
                    <option value="under_review">Em Revisão</option>
                    <option value="approved">Aprovada</option>
                    <option value="rejected">Rejeitada</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>

                <div class="col-md-3">
                  <label for="search" class="form-label">Buscar</label>
                  <input
                    type="text"
                    id="search"
                    class="form-control"
                    v-model="filters.search"
                    @input="debounceSearch"
                    placeholder="Título, descrição..."
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="mt-3">A carregar propostas...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="proposals.length === 0" class="text-center py-5">
        <i class="bi bi-file-earmark-x fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">Nenhuma proposta encontrada</h5>
        <p class="text-muted mb-4">
          {{ filters.search || filters.status ? 'Tente ajustar os filtros de busca.' : 'Ainda não existem propostas.' }}
        </p>
        <router-link
          to="/proposals/create"
          class="btn btn-primary"
        >
          <i class="bi bi-plus-circle me-2"></i>
          Criar Primeira Proposta
        </router-link>
      </div>

      <!-- Proposals List -->
      <div v-else class="row">
        <div class="col-12">
          <div class="proposals-grid">
            <div
              v-for="proposal in proposals"
              :key="proposal._id"
              class="proposal-card card mb-3"
              @click="viewProposal(proposal._id)"
            >
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title mb-0">{{ proposal.title || 'Sem título' }}</h5>
                  <span :class="getStatusBadgeClass(proposal.status)">
                    {{ getStatusDisplayName(proposal.status) }}
                  </span>
                </div>

                <p class="card-text text-muted mb-3">
                  {{ truncateText(proposal.description, 150) }}
                </p>

                <!-- Keywords -->
                <div v-if="proposal.keywords && proposal.keywords.length > 0" class="mb-3">
                  <div class="d-flex flex-wrap gap-1">
                    <span 
                      v-for="keyword in proposal.keywords.slice(0, 3)" 
                      :key="keyword"
                      class="badge bg-light text-dark border"
                      style="font-size: 0.75rem;"
                    >
                      {{ keyword }}
                    </span>
                    <span 
                      v-if="proposal.keywords.length > 3" 
                      class="badge bg-light text-muted border"
                      style="font-size: 0.75rem;"
                    >
                      +{{ proposal.keywords.length - 3 }}
                    </span>
                  </div>
                </div>

                <div class="proposal-meta d-flex justify-content-between align-items-center">
                  <div class="meta-info">
                    <small class="text-muted" v-if="proposal.advisor">
                      <i class="bi bi-person-badge me-1"></i>
                      {{ proposal.advisor.full_name || proposal.advisor.name || 'Orientador' }}
                    </small>
                    <small class="text-muted" v-else>
                      <i class="bi bi-person-badge me-1"></i>
                      Orientador não atribuído
                    </small>
                    
                    <small class="text-muted ms-3">
                      <i class="bi bi-calendar me-1"></i>
                      {{ formatDate(proposal.created_at) }}
                    </small>
                  </div>

                  <div class="proposal-actions">
                    <button
                      @click.stop="viewProposal(proposal._id)"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-eye me-1"></i>
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Direct API import
import api from '@/api';

export default {
  name: 'ProposalListView',
  data() {
    return {
      proposals: [],
      loading: false,
      filters: {
        status: '',
        search: '',
      },
      searchTimeout: null,
    };
  },
  mounted() {
    this.loadProposals();
  },
  methods: {
    // Helper methods - MAKE SURE THESE ARE DEFINED
    getStatusBadgeClass(status) {
      const classes = {
        draft: 'badge bg-secondary',
        pending: 'badge bg-warning',
        submitted: 'badge bg-info',
        under_review: 'badge bg-warning',
        approved: 'badge bg-success',
        rejected: 'badge bg-danger',
        completed: 'badge bg-primary',
        archived: 'badge bg-dark',
      };
      return classes[status?.toLowerCase()] || 'badge bg-secondary';
    },

    getStatusDisplayName(status) {
      const names = {
        draft: 'Rascunho',
        pending: 'Pendente',
        submitted: 'Submetida',
        under_review: 'Em Revisão',
        approved: 'Aprovada',
        rejected: 'Rejeitada',
        completed: 'Concluída',
        archived: 'Arquivada',
      };
      return names[status?.toLowerCase()] || status || 'Desconhecido';
    },

    truncateText(text, maxLength) {
      if (!text) return 'Sem descrição';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    formatDate(date) {
      if (!date) return 'Data não definida';
      try {
        return new Date(date).toLocaleDateString('pt-PT');
      } catch (e) {
        return 'Data inválida';
      }
    },

    // Main methods
    async loadProposals() {
      this.loading = true;
      console.log('Loading proposals...');

      try {
        const params = {
          status: this.filters.status || undefined,
          search: this.filters.search || undefined,
          limit: 10,
        };

        // Clean params
        Object.keys(params).forEach(key => {
          if (params[key] === undefined || params[key] === '') {
            delete params[key];
          }
        });

        console.log('API call params:', params);
        
        // Direct API call
        const response = await api.get('proposals', { params });
        
        console.log('API response:', response.data);
        
        // Extract proposals from response
        let proposals = [];
        const responseData = response.data;
        
        if (responseData.data && responseData.data.proposals) {
          // Structure: { data: { proposals: [], pagination: {} } }
          proposals = responseData.data.proposals;
        } else if (responseData.proposals) {
          // Structure: { proposals: [] }
          proposals = responseData.proposals;
        } else if (Array.isArray(responseData)) {
          // Structure: []
          proposals = responseData;
        } else if (Array.isArray(responseData.data)) {
          // Structure: { data: [] }
          proposals = responseData.data;
        }
        
        console.log('Extracted proposals:', proposals);
        this.proposals = proposals;
        
      } catch (error) {
        console.error('Error loading proposals from API:', error);
        
        // Fallback to mock data
        console.log('Using mock data...');
        this.proposals = [];
        
      } finally {
        this.loading = false;
      }
    },

    getMockProposals() {
      return [
        {
          _id: '1',
          title: 'Sistema de Gestão de Propostas Académicas',
          description: 'Desenvolvimento de uma plataforma web completa para gestão de propostas de projetos finais na universidade.',
          status: 'approved',
          advisor: {
            full_name: 'Dr. João Silva',
            email: 'joao.silva@universidade.pt'
          },
          keywords: ['web', 'gestão', 'propostas', 'académico'],
          created_at: '2024-01-15T10:30:00Z',
        },
        {
          _id: '2',
          title: 'Análise de Dados Educacionais',
          description: 'Projeto de análise de dados educacionais utilizando técnicas de machine learning para identificar padrões de sucesso académico.',
          status: 'submitted',
          advisor: {
            full_name: 'Dra. Maria Santos',
            email: 'maria.santos@universidade.pt'
          },
          keywords: ['data science', 'educação', 'machine learning'],
          created_at: '2024-01-14T14:20:00Z',
        },
        {
          _id: '3',
          title: 'Plataforma de E-Learning Interativa',
          description: 'Desenvolvimento de uma plataforma de e-learning com funcionalidades interativas e gamificação.',
          status: 'under_review',
          advisor: {
            full_name: 'Prof. Carlos Pereira',
            email: 'carlos.pereira@universidade.pt'
          },
          keywords: ['e-learning', 'gamificação', 'educação'],
          created_at: '2024-01-10T09:15:00Z',
        },
        {
          _id: '4',
          title: 'Aplicação Mobile para Saúde Mental',
          description: 'Criação de uma aplicação móvel para acompanhamento de saúde mental com funcionalidades de diário e mindfulness.',
          status: 'draft',
          advisor: {
            full_name: 'Dra. Ana Costa',
            email: 'ana.costa@universidade.pt'
          },
          keywords: ['mobile', 'saúde mental', 'mindfulness'],
          created_at: '2024-01-08T11:45:00Z',
        },
        {
          _id: '5',
          title: 'Sistema de Recomendação de Conteúdo',
          description: 'Desenvolvimento de um sistema de recomendação de conteúdos educacionais baseado no perfil do utilizador.',
          status: 'rejected',
          advisor: {
            full_name: 'Dr. Pedro Alves',
            email: 'pedro.alves@universidade.pt'
          },
          keywords: ['recomendação', 'personalização', 'conteúdo'],
          created_at: '2024-01-05T16:30:00Z',
        },
      ];
    },

    checkAuthentication() {
    // Method 1: Check localStorage/sessionStorage
    const token = this.getAuthToken();
    const user = this.getUserData();
    
    if (!token || !user) {
      // Method 2: Check if token exists in Vuex/Pinia
      if (this.$store && this.$store.state.auth && this.$store.state.auth.token) {
        return true;
      }
      
      // Method 3: Check if there's any token-like string in localStorage
      const allStorage = { ...localStorage, ...sessionStorage };
      const hasAnyToken = Object.values(allStorage).some(value => 
        value && value.length > 20 && (value.includes('.') || value.length === 64)
      );
      
      return hasAnyToken;
    }
    
    return true;
  },
  
  getAuthToken() {
    // Check all possible token locations
    const possibleTokenKeys = [
      'auth_token', 'token', 'access_token', 'jwt_token',
      'authToken', 'accessToken', 'jwtToken'
    ];
    
    for (const key of possibleTokenKeys) {
      const token = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (token) {
        console.log(`Found token with key: ${key}`);
        return token;
      }
    }
    
    return null;
  },
  
  getUserData() {
    // Check all possible user data locations
    const possibleUserKeys = [
      'user_data', 'user', 'currentUser', 'auth_user',
      'userData', 'current_user'
    ];
    
    for (const key of possibleUserKeys) {
      const user = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (user) {
        console.log(`Found user data with key: ${key}`);
        return user;
      }
    }
    
    return null;
  },
  
  viewProposal(id) {
    console.log('🔗 Navigating to proposal:', id);
    
    if (!this.checkAuthentication()) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      alert('Sessão expirada ou não autenticado. Por favor, faça login novamente.');
      this.$router.push('/login');
      return;
    }
    
    console.log('✅ User authenticated, navigating to proposal detail');
    this.$router.push(`/proposals/${id}`);
  },

    applyFilters() {
      console.log('Applying filters:', this.filters);
      this.loadProposals();
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.applyFilters();
      }, 500);
    },

    refreshProposals() {
      console.log('Refreshing proposals...');
      this.loadProposals();
    },
  },
};
</script>

<style scoped>
.proposals-grid {
  display: grid;
  gap: 1rem;
}

.proposal-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.proposal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.proposal-meta {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .d-flex.justify-content-between {
    flex-direction: column;
    gap: 1rem;
  }

  .proposal-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
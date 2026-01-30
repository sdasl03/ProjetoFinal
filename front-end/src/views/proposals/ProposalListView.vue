<template>
  <div class="proposals-list">
    <div class="container-fluid">
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
                v-if="canCreateProposal"
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

                <div class="col-md-3">
                  <label for="sortBy" class="form-label">Ordenar por</label>
                  <select
                    id="sortBy"
                    class="form-select"
                    v-model="filters.sortBy"
                    @change="applyFilters"
                  >
                    <option value="createdAt">Data de Criação</option>
                    <option value="updatedAt">Última Atualização</option>
                    <option value="title">Título</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                <div class="col-md-3">
                  <label for="sortOrder" class="form-label">Ordem</label>
                  <select
                    id="sortOrder"
                    class="form-select"
                    v-model="filters.sortOrder"
                    @change="applyFilters"
                  >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Proposals List -->
      <div class="row">
        <div class="col-12">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>

          <div v-else-if="proposals.length === 0" class="text-center py-5">
            <i class="bi bi-file-earmark-x fs-1 text-muted mb-3"></i>
            <h5 class="text-muted">Nenhuma proposta encontrada</h5>
            <p class="text-muted">
              {{ filters.search ? 'Tente ajustar os filtros de busca.' : 'Seja o primeiro a criar uma proposta!' }}
            </p>
            <router-link
              v-if="canCreateProposal"
              to="/proposals/create"
              class="btn btn-primary"
            >
              <i class="bi bi-plus-circle me-2"></i>
              Criar Primeira Proposta
            </router-link>
          </div>

          <div v-else class="proposals-grid">
            <div
              v-for="proposal in proposals"
              :key="proposal.id"
              class="proposal-card card mb-3"
              @click="viewProposal(proposal.id)"
            >
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title mb-0">{{ proposal.title }}</h5>
                  <span :class="getStatusBadgeClass(proposal.status)">
                    {{ getStatusDisplayName(proposal.status) }}
                  </span>
                </div>

                <p class="card-text text-muted mb-3">
                  {{ truncateText(proposal.description, 150) }}
                </p>

                <div class="proposal-meta d-flex justify-content-between align-items-center">
                  <div class="meta-info">
                    <small class="text-muted">
                      <i class="bi bi-person me-1"></i>
                      {{ proposal.author?.name }}
                    </small>
                    <small class="text-muted ms-3">
                      <i class="bi bi-calendar me-1"></i>
                      {{ formatDate(proposal.createdAt) }}
                    </small>
                  </div>

                  <div class="proposal-actions">
                    <button
                      @click.stop="viewProposal(proposal.id)"
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

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="row mt-4">
        <div class="col-12">
          <nav aria-label="Proposals pagination">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button
                  class="page-link"
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                >
                  Anterior
                </button>
              </li>

              <li
                v-for="page in visiblePages"
                :key="page"
                class="page-item"
                :class="{ active: page === currentPage }"
              >
                <button class="page-link" @click="changePage(page)">
                  {{ page }}
                </button>
              </li>

              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button
                  class="page-link"
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                >
                  Próximo
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'ProposalListView',
  data() {
    return {
      proposals: [],
      loading: false,
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      filters: {
        status: '',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      searchTimeout: null,
    };
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'isProfessor', 'isAdmin', 'user']),

    canCreateProposal() {
      return this.isAuthenticated && (this.isProfessor || this.isAdmin);
    },

    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    },
  },
  mounted() {
    this.loadProposals();
  },
  methods: {
    async loadProposals() {
      this.loading = true;

      try {
        // This would load proposals from the API
        // For now, just set empty array
        this.proposals = [];
        this.totalPages = 1;
        this.totalItems = 0;
      } catch (error) {
        console.error('Error loading proposals:', error);
        this.$store.dispatch('ui/addNotification', {
          type: 'error',
          message: 'Erro ao carregar propostas.',
          duration: 5000,
        });
      } finally {
        this.loading = false;
      }
    },

    viewProposal(id) {
      this.$router.push(`/proposals/${id}`);
    },

    applyFilters() {
      this.currentPage = 1;
      this.loadProposals();
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.applyFilters();
      }, 500);
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.loadProposals();
      }
    },

    refreshProposals() {
      this.loadProposals();
    },

    getStatusBadgeClass(status) {
      const classes = {
        draft: 'badge bg-secondary',
        submitted: 'badge bg-info',
        under_review: 'badge bg-warning',
        approved: 'badge bg-success',
        rejected: 'badge bg-danger',
        completed: 'badge bg-primary',
      };
      return classes[status] || 'badge bg-secondary';
    },

    getStatusDisplayName(status) {
      const names = {
        draft: 'Rascunho',
        submitted: 'Submetida',
        under_review: 'Em Revisão',
        approved: 'Aprovada',
        rejected: 'Rejeitada',
        completed: 'Concluída',
      };
      return names[status] || status;
    },

    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('pt-PT');
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

.proposal-actions .btn {
  margin-left: 0.5rem;
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
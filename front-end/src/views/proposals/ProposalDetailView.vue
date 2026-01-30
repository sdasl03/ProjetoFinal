<template>
  <div class="proposal-detail">
    <div class="container-fluid">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Proposal Content -->
      <div v-else-if="proposal" class="proposal-content">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <nav aria-label="breadcrumb">
                  <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                      <router-link to="/proposals">Propostas</router-link>
                    </li>
                    <li class="breadcrumb-item active">{{ proposal.title }}</li>
                  </ol>
                </nav>
                <h1 class="mb-2">{{ proposal.title }}</h1>
                <div class="d-flex align-items-center gap-3 mb-3">
                  <span :class="getStatusBadgeClass(proposal.status)">
                    {{ getStatusDisplayName(proposal.status) }}
                  </span>
                  <small class="text-muted">
                    <i class="bi bi-calendar me-1"></i>
                    Criada em {{ formatDate(proposal.createdAt) }}
                  </small>
                  <small class="text-muted">
                    <i class="bi bi-pencil me-1"></i>
                    Última atualização {{ formatDate(proposal.updatedAt) }}
                  </small>
                </div>
              </div>

              <div class="action-buttons d-flex gap-2">
                <button
                  v-if="canEdit"
                  @click="editProposal"
                  class="btn btn-outline-primary"
                >
                  <i class="bi bi-pencil me-2"></i>
                  Editar
                </button>

                <button
                  v-if="canDelete"
                  @click="deleteProposal"
                  class="btn btn-outline-danger"
                  :disabled="deleting"
                >
                  <i class="bi bi-trash me-2"></i>
                  {{ deleting ? 'Excluindo...' : 'Excluir' }}
                </button>

                <button
                  @click="exportProposal"
                  class="btn btn-outline-secondary"
                >
                  <i class="bi bi-download me-2"></i>
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Main Content -->
          <div class="col-lg-8 mb-4">
            <!-- Description -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">Descrição</h5>
              </div>
              <div class="card-body">
                <div v-if="proposal.description" class="proposal-description">
                  {{ proposal.description }}
                </div>
                <div v-else class="text-muted">
                  <i class="bi bi-info-circle me-2"></i>
                  Nenhuma descrição fornecida.
                </div>
              </div>
            </div>

            <!-- Objectives -->
            <div v-if="proposal.objectives" class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">Objetivos</h5>
              </div>
              <div class="card-body">
                <div class="proposal-objectives">
                  {{ proposal.objectives }}
                </div>
              </div>
            </div>

            <!-- Methodology -->
            <div v-if="proposal.methodology" class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">Metodologia</h5>
              </div>
              <div class="card-body">
                <div class="proposal-methodology">
                  {{ proposal.methodology }}
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div v-if="proposal.timeline" class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">Cronograma</h5>
              </div>
              <div class="card-body">
                <div class="proposal-timeline">
                  {{ proposal.timeline }}
                </div>
              </div>
            </div>

            <!-- Files -->
            <div v-if="proposal.files && proposal.files.length > 0" class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">Ficheiros Anexados</h5>
              </div>
              <div class="card-body">
                <div class="files-list">
                  <div
                    v-for="file in proposal.files"
                    :key="file.id"
                    class="file-item d-flex align-items-center justify-content-between p-2 border rounded mb-2"
                  >
                    <div class="d-flex align-items-center">
                      <i class="bi bi-file-earmark me-2"></i>
                      <div>
                        <span class="fw-medium">{{ file.name }}</span>
                        <small class="text-muted d-block">{{ formatFileSize(file.size) }}</small>
                      </div>
                    </div>
                    <button
                      @click="downloadFile(file)"
                      class="btn btn-sm btn-outline-primary"
                    >
                      <i class="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="col-lg-4">
            <!-- Author Info -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0">Autor</h6>
              </div>
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="author-avatar me-3">
                    <i class="bi bi-person-circle fs-2 text-secondary"></i>
                  </div>
                  <div>
                    <h6 class="mb-1">{{ proposal.author?.name }}</h6>
                    <p class="text-muted mb-1">{{ proposal.author?.email }}</p>
                    <small class="text-muted">{{ getRoleDisplayName(proposal.author?.role) }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status History -->
            <div v-if="proposal.statusHistory && proposal.statusHistory.length > 0" class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0">Histórico de Status</h6>
              </div>
              <div class="card-body">
                <div class="status-timeline">
                  <div
                    v-for="(status, index) in proposal.statusHistory"
                    :key="index"
                    class="status-item d-flex mb-3"
                  >
                    <div class="status-dot me-3">
                      <i class="bi bi-circle-fill text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-start">
                        <span :class="getStatusBadgeClass(status.status)">
                          {{ getStatusDisplayName(status.status) }}
                        </span>
                        <small class="text-muted">{{ formatDate(status.changedAt) }}</small>
                      </div>
                      <p v-if="status.comment" class="mb-0 mt-1 small text-muted">
                        {{ status.comment }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Co-advisors -->
            <div v-if="proposal.coadvisors && proposal.coadvisors.length > 0" class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0">Coorientadores</h6>
              </div>
              <div class="card-body">
                <div
                  v-for="coadvisor in proposal.coadvisors"
                  :key="coadvisor.id"
                  class="coadvisor-item d-flex align-items-center mb-2"
                >
                  <div class="coadvisor-avatar me-2">
                    <i class="bi bi-person-circle text-secondary"></i>
                  </div>
                  <div>
                    <small class="fw-medium">{{ coadvisor.name }}</small>
                    <small class="text-muted d-block">{{ coadvisor.email }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Applications (for students) -->
            <div v-if="isStudent && proposal.status === 'approved'" class="card">
              <div class="card-header">
                <h6 class="mb-0">Candidatura</h6>
              </div>
              <div class="card-body">
                <p class="mb-3">Interessado neste projeto? Faça sua candidatura!</p>
                <button
                  v-if="!hasApplied"
                  @click="applyToProposal"
                  class="btn btn-success w-100"
                  :disabled="applying"
                >
                  <i class="bi bi-send me-2"></i>
                  {{ applying ? 'Candidatando...' : 'Candidatar-se' }}
                </button>
                <div v-else class="text-center">
                  <i class="bi bi-check-circle-fill text-success fs-2 mb-2"></i>
                  <p class="mb-0 text-success fw-medium">Já se candidatou!</p>
                  <small class="text-muted">Aguarde a resposta do orientador.</small>
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
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'ProposalDetailView',
  data() {
    return {
      proposal: null,
      loading: false,
      error: null,
      deleting: false,
      applying: false,
      hasApplied: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'isStudent', 'isProfessor', 'isAdmin', 'user']),

    canEdit() {
      if (!this.isAuthenticated) return false;
      return this.isAdmin ||
             (this.isProfessor && this.proposal?.author?.id === this.user?.id);
    },

    canDelete() {
      if (!this.isAuthenticated) return false;
      return this.isAdmin ||
             (this.isProfessor && this.proposal?.author?.id === this.user?.id);
    },
  },
  mounted() {
    this.loadProposal();
  },
  methods: {
    ...mapActions('ui', ['addNotification']),

    async loadProposal() {
      this.loading = true;
      this.error = null;

      try {
        const proposalId = this.$route.params.id;
        // This would load the proposal from the API
        // For now, just set a placeholder
        this.proposal = {
          id: proposalId,
          title: 'Sample Proposal',
          description: 'This is a sample proposal description.',
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'professor',
          },
        };
      } catch (error) {
        console.error('Error loading proposal:', error);
        this.error = 'Erro ao carregar proposta.';
      } finally {
        this.loading = false;
      }
    },

    editProposal() {
      this.$router.push(`/proposals/${this.proposal.id}/edit`);
    },

    async deleteProposal() {
      if (!confirm('Tem certeza que deseja excluir esta proposta?')) {
        return;
      }

      this.deleting = true;

      try {
        // This would delete the proposal via API
        // await this.$store.dispatch('proposals/deleteProposal', this.proposal.id);

        this.addNotification({
          type: 'success',
          message: 'Proposta excluída com sucesso!',
          duration: 3000,
        });

        this.$router.push('/proposals');
      } catch (error) {
        console.error('Error deleting proposal:', error);
        this.addNotification({
          type: 'error',
          message: 'Erro ao excluir proposta.',
          duration: 5000,
        });
      } finally {
        this.deleting = false;
      }
    },

    exportProposal() {
      // This would export the proposal as PDF or other format
      console.log('Exporting proposal...');
    },

    async applyToProposal() {
      this.applying = true;

      try {
        // This would submit application via API
        // await this.$store.dispatch('applications/apply', this.proposal.id);

        this.hasApplied = true;
        this.addNotification({
          type: 'success',
          message: 'Candidatura enviada com sucesso!',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error applying to proposal:', error);
        this.addNotification({
          type: 'error',
          message: 'Erro ao enviar candidatura.',
          duration: 5000,
        });
      } finally {
        this.applying = false;
      }
    },

    downloadFile(file) {
      // This would download the file
      console.log('Downloading file:', file.name);
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

    getRoleDisplayName(role) {
      const roles = {
        admin: 'Administrador',
        professor: 'Professor',
        coadvisor: 'Coorientador',
        student: 'Estudante',
      };
      return roles[role] || role;
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('pt-PT');
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  },
};
</script>

<style scoped>
.proposal-content {
  padding: 2rem 0;
}

.card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: none;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.proposal-description,
.proposal-objectives,
.proposal-methodology,
.proposal-timeline {
  white-space: pre-wrap;
  line-height: 1.6;
}

.status-timeline {
  position: relative;
}

.status-timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e9ecef;
}

.status-dot {
  position: relative;
  z-index: 1;
}

.author-avatar,
.coadvisor-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 50%;
}

.file-item {
  background-color: #f8f9fa;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #e9ecef;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .action-buttons .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
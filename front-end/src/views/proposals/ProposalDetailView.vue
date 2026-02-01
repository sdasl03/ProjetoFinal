<template>
  <div class="proposal-detail">
    <div class="container">
      <!-- Back Button -->
      <div class="mb-4">
        <router-link to="/proposals" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-2"></i>
          Voltar às Propostas
        </router-link>
      </div>

      <!-- Proposal Content -->
      <div v-if="proposal" class="card">
        <div class="card-body">
          <!-- Status Badge -->
          <div class="mb-3">
            <span :class="getStatusBadgeClass(proposal.status)" class="fs-6">
              {{ getStatusDisplayName(proposal.status) }}
            </span>
          </div>

          <!-- Title -->
          <h1 class="mb-4">{{ proposal.title }}</h1>

          <!-- Basic Info -->
          <div class="row mb-4">
            <div class="col-md-6">
              <p class="text-muted mb-1">
                <i class="bi bi-calendar me-2"></i>
                Criada em: {{ formatDate(proposal.created_at) }}
              </p>
            </div>
            <div class="col-md-6 text-md-end">
              <p class="text-muted mb-1">
                <i class="bi bi-person-badge me-2"></i>
                Orientador: {{ proposal.advisor?.full_name || 'Dr. João Silva' }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-5">
            <h4 class="mb-3">
              <i class="bi bi-text-paragraph me-2"></i>
              Descrição
            </h4>
            <div class="bg-light p-4 rounded">
              <p class="mb-0">{{ proposal.description }}</p>
            </div>
          </div>

          <!-- Objectives -->
          <div class="mb-5" v-if="proposal.objectives && proposal.objectives.length > 0">
            <h4 class="mb-3">
              <i class="bi bi-bullseye me-2"></i>
              Objetivos
            </h4>
            <ul class="list-group">
              <li v-for="(objective, index) in proposal.objectives" :key="index" 
                  class="list-group-item">
                {{ objective }}
              </li>
            </ul>
          </div>

          <!-- Keywords -->
          <div class="mb-5" v-if="proposal.keywords && proposal.keywords.length > 0">
            <h4 class="mb-3">
              <i class="bi bi-tags me-2"></i>
              Palavras-chave
            </h4>
            <div class="d-flex flex-wrap gap-2">
              <span v-for="keyword in proposal.keywords" :key="keyword" 
                    class="badge bg-primary">
                {{ keyword }}
              </span>
            </div>
          </div>

          <!-- Files Section -->
          <div class="mb-5">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 class="mb-0">
                <i class="bi bi-paperclip me-2"></i>
                Ficheiros Anexados
              </h4>
              <button 
                @click="showUploadModal = true" 
                class="btn btn-primary btn-sm"
                v-if="canUploadFiles"
              >
                <i class="bi bi-plus-circle me-1"></i>
                Adicionar Ficheiro
              </button>
            </div>

            <!-- Files List -->
            <div v-if="proposal.files && proposal.files.length > 0" class="files-list">
              <div v-for="file in proposal.files" :key="file.id" class="file-item card mb-2">
                <div class="card-body py-2">
                  <div class="d-flex align-items-center">
                    <div class="file-icon me-3">
                      <i :class="getFileIcon(file.type)"></i>
                    </div>
                    <div class="file-info flex-grow-1">
                      <h6 class="mb-0">{{ file.name }}</h6>
                      <small class="text-muted">
                        {{ formatFileSize(file.size) }} • 
                        Adicionado {{ formatDate(file.uploaded_at) }} por {{ file.uploaded_by }}
                      </small>
                    </div>
                    <div class="file-actions">
                      <button 
                        @click.stop="downloadFile(file)" 
                        class="btn btn-sm btn-outline-primary me-1"
                        title="Descarregar"
                      >
                        <i class="bi bi-download"></i>
                      </button>
                      <button 
                        @click.stop="previewFile(file)" 
                        class="btn btn-sm btn-outline-secondary me-1"
                        title="Pré-visualizar"
                        v-if="canPreviewFile(file)"
                      >
                        <i class="bi bi-eye"></i>
                      </button>
                      <button 
                        @click.stop="deleteFile(file.id)" 
                        class="btn btn-sm btn-outline-danger"
                        title="Eliminar"
                        v-if="canDeleteFile(file)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Files Message -->
            <div v-else class="text-center py-4 border rounded">
              <i class="bi bi-folder-x fs-1 text-muted mb-3"></i>
              <p class="text-muted mb-0">Nenhum ficheiro anexado</p>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="row">
            <div class="col-md-4 mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">
                    <i class="bi bi-building me-2"></i>
                    Departamento
                  </h6>
                  <p class="card-text">{{ proposal.department || 'Ciência dos Computadores' }}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">
                    <i class="bi bi-calendar-range me-2"></i>
                    Ano Académico
                  </h6>
                  <p class="card-text">{{ proposal.academic_year || '2024-2025' }}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <div class="card">
                <div class="card-body">
                  <h6 class="card-title">
                    <i class="bi bi-info-circle me-2"></i>
                    ID da Proposta
                  </h6>
                  <p class="card-text">
                    <code>{{ proposal._id || proposal.id }}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex gap-2 mt-4 pt-4 border-top">
            <button @click="contactAdvisor" class="btn btn-outline-primary">
              <i class="bi bi-envelope me-1"></i>
              Contactar Orientador
            </button>
            <button @click="applyToProject" class="btn btn-success" v-if="proposal.status === 'approved'">
              <i class="bi bi-check-circle me-1"></i>
              Candidatar-se ao Projeto
            </button>
            <button @click="printPage" class="btn btn-outline-secondary ms-auto">
              <i class="bi bi-printer me-1"></i>
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">A carregar proposta...</p>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Adicionar Ficheiro</h5>
            <button type="button" class="btn-close" @click="showUploadModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="uploadFile">
              <div class="mb-3">
                <label for="fileInput" class="form-label">Selecionar Ficheiro</label>
                <input 
                  type="file" 
                  id="fileInput" 
                  class="form-control" 
                  ref="fileInput"
                  @change="handleFileSelect"
                  required
                >
                <div class="form-text">
                  Tamanho máximo: 10MB. Tipos permitidos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG
                </div>
              </div>
              
              <div class="mb-3" v-if="selectedFile">
                <label class="form-label">Informação do Ficheiro</label>
                <div class="alert alert-light">
                  <p class="mb-1"><strong>Nome:</strong> {{ selectedFile.name }}</p>
                  <p class="mb-1"><strong>Tamanho:</strong> {{ formatFileSize(selectedFile.size) }}</p>
                  <p class="mb-0"><strong>Tipo:</strong> {{ selectedFile.type || 'Não identificado' }}</p>
                </div>
              </div>

              <div class="mb-3">
                <label for="fileDescription" class="form-label">Descrição (opcional)</label>
                <textarea 
                  id="fileDescription" 
                  class="form-control" 
                  v-model="fileDescription" 
                  rows="2"
                  placeholder="Descrição do ficheiro..."
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Visibilidade</label>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    id="visibilityPublic" 
                    v-model="fileVisibility" 
                    value="public"
                  >
                  <label class="form-check-label" for="visibilityPublic">
                    <i class="bi bi-globe me-1"></i>
                    Público (todos os utilizadores podem ver)
                  </label>
                </div>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    id="visibilityPrivate" 
                    v-model="fileVisibility" 
                    value="private"
                  >
                  <label class="form-check-label" for="visibilityPrivate">
                    <i class="bi bi-lock me-1"></i>
                    Privado (apenas eu e o orientador)
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showUploadModal = false">
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="uploadFile" 
              :disabled="!selectedFile || uploading"
            >
              <span v-if="uploading" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-upload me-1"></i>
              {{ uploading ? 'A enviar...' : 'Enviar Ficheiro' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal && previewFileData" class="modal-overlay">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pré-visualização: {{ previewFileData.name }}</h5>
            <button type="button" class="btn-close" @click="showPreviewModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="isImageFile(previewFileData)" class="text-center">
              <img :src="previewFileData.url" :alt="previewFileData.name" class="img-fluid">
            </div>
            <div v-else-if="isPdfFile(previewFileData)" class="pdf-preview">
              <p class="text-muted text-center">
                <i class="bi bi-file-pdf fs-1"></i>
                <br>
                Visualização de PDF disponível ao descarregar o ficheiro.
              </p>
            </div>
            <div v-else class="text-center">
              <i :class="getFileIcon(previewFileData.type)" class="fs-1 text-muted"></i>
              <p class="mt-3">Pré-visualização não disponível para este tipo de ficheiro.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showPreviewModal = false">
              Fechar
            </button>
            <button type="button" class="btn btn-primary" @click="downloadFile(previewFileData)">
              <i class="bi bi-download me-1"></i>
              Descarregar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProposalDetailView',
  data() {
    return {
      proposal: null,
      showUploadModal: false,
      showPreviewModal: false,
      selectedFile: null,
      fileDescription: '',
      fileVisibility: 'public',
      uploading: false,
      previewFileData: null,
      // Mock current user (in real app, get from auth store)
      currentUser: {
        id: 'user123',
        name: 'João Estudante',
        role: 'student' // student, advisor, admin
      }
    };
  },
  computed: {
    canUploadFiles() {
      // Allow upload based on user role and proposal status
      const allowedStatuses = ['draft', 'submitted', 'under_review'];
      return allowedStatuses.includes(this.proposal?.status) && 
             ['student', 'advisor', 'admin'].includes(this.currentUser.role);
    }
  },
  mounted() {
    this.loadProposal();
  },
  methods: {
    loadProposal() {
      const id = this.$route.params.id;
      console.log('Loading proposal:', id);
      
      // Always use mock data
      this.proposal = this.getMockProposal(id);
      
      // Initialize files array if not present
      if (!this.proposal.files) {
        this.proposal.files = this.getMockFiles();
      }
    },
    
    getMockProposal(id) {
      const proposals = [
        {
          _id: '1',
          title: 'Sistema de Gestão de Propostas Académicas',
          description: 'Desenvolvimento de uma plataforma web completa para gestão de propostas de projetos finais na universidade.',
          status: 'approved',
          academic_year: '2024-2025',
          department: 'Ciência dos Computadores',
          advisor: {
            full_name: 'Dr. João Silva',
            email: 'joao.silva@universidade.pt',
            department: 'Ciência dos Computadores'
          },
          objectives: [
            'Desenvolver interface de utilizador responsiva e intuitiva',
            'Implementar sistema de autenticação e autorização seguro',
            'Criar dashboard de acompanhamento para estudantes e professores'
          ],
          keywords: ['gestão', 'propostas', 'académico', 'web', 'plataforma'],
          created_at: '2024-01-15T10:30:00Z',
          files: this.getMockFiles()
        },
        {
          _id: '2',
          title: 'Análise de Dados Educacionais com Machine Learning',
          description: 'Projeto focado em análise de dados educacionais.',
          status: 'submitted',
          academic_year: '2024-2025',
          department: 'Engenharia Informática',
          advisor: {
            full_name: 'Dra. Maria Santos',
            email: 'maria.santos@universidade.pt',
            department: 'Engenharia Informática'
          },
          objectives: [
            'Coletar e limpar dados educacionais históricos',
            'Aplicar algoritmos de machine learning para análise preditiva'
          ],
          keywords: ['machine learning', 'data science', 'educação'],
          created_at: '2024-01-14T14:20:00Z',
          files: this.getMockFiles()
        }
      ];

      const found = proposals.find(p => p._id === id) || proposals[0];
      return { ...found, _id: id };
    },

    getMockFiles() {
      return [
        {
          id: 'file1',
          name: 'proposta_tecnica.pdf',
          size: 2456789,
          type: 'application/pdf',
          url: '#',
          uploaded_at: '2024-01-16T09:30:00Z',
          uploaded_by: 'João Estudante',
          description: 'Documento técnico detalhado da proposta',
          visibility: 'public'
        },
        {
          id: 'file2',
          name: 'cronograma.xlsx',
          size: 567890,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          url: '#',
          uploaded_at: '2024-01-16T14:20:00Z',
          uploaded_by: 'Dr. João Silva',
          description: 'Cronograma de desenvolvimento',
          visibility: 'public'
        },
        {
          id: 'file3',
          name: 'diagrama_arquitetura.png',
          size: 1234567,
          type: 'image/png',
          url: 'https://via.placeholder.com/800x600/3b5998/ffffff?text=Diagrama+Arquitetura',
          uploaded_at: '2024-01-17T11:15:00Z',
          uploaded_by: 'João Estudante',
          description: 'Diagrama da arquitetura do sistema',
          visibility: 'private'
        }
      ];
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          alert('Ficheiro muito grande. Tamanho máximo: 10MB');
          event.target.value = '';
          this.selectedFile = null;
          return;
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif'
        ];

        if (!allowedTypes.includes(file.type)) {
          alert('Tipo de ficheiro não permitido. Use PDF, Word, Excel, PowerPoint ou imagens.');
          event.target.value = '';
          this.selectedFile = null;
          return;
        }

        this.selectedFile = file;
      }
    },

    async uploadFile() {
      if (!this.selectedFile) {
        alert('Por favor, selecione um ficheiro');
        return;
      }

      this.uploading = true;

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create new file object
        const newFile = {
          id: 'file' + Date.now(),
          name: this.selectedFile.name,
          size: this.selectedFile.size,
          type: this.selectedFile.type,
          url: '#',
          uploaded_at: new Date().toISOString(),
          uploaded_by: this.currentUser.name,
          description: this.fileDescription,
          visibility: this.fileVisibility
        };

        // Add to proposal files
        if (!this.proposal.files) {
          this.proposal.files = [];
        }
        this.proposal.files.unshift(newFile);

        // Reset form
        this.resetUploadForm();
        this.showUploadModal = false;

        // Show success message
        alert('Ficheiro adicionado com sucesso!');

      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Erro ao enviar ficheiro. Por favor, tente novamente.');
      } finally {
        this.uploading = false;
      }
    },

    resetUploadForm() {
      this.selectedFile = null;
      this.fileDescription = '';
      this.fileVisibility = 'public';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },

    downloadFile(file) {
      // In a real app, this would be a proper download
      console.log('Downloading file:', file.name);
      alert(`Iniciando download de "${file.name}"\n\n(Em produção, isto descarregaria o ficheiro)`);
      
      // Simulate download
      const link = document.createElement('a');
      link.href = file.url || '#';
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    previewFile(file) {
      if (this.canPreviewFile(file)) {
        this.previewFileData = file;
        this.showPreviewModal = true;
      }
    },

    deleteFile(fileId) {
      if (confirm('Tem a certeza que deseja eliminar este ficheiro?')) {
        this.proposal.files = this.proposal.files.filter(f => f.id !== fileId);
        alert('Ficheiro eliminado com sucesso!');
      }
    },

    canDeleteFile(file) {
      // Allow delete if user uploaded the file or is admin/advisor
      return file.uploaded_by === this.currentUser.name || 
             ['admin', 'advisor'].includes(this.currentUser.role);
    },

    canPreviewFile(file) {
      // For now, only preview images
      return this.isImageFile(file);
    },

    isImageFile(file) {
      return file.type && file.type.startsWith('image/');
    },

    isPdfFile(file) {
      return file.type === 'application/pdf';
    },

    getFileIcon(fileType) {
      if (!fileType) return 'bi bi-file-earmark';
      
      if (fileType.includes('pdf')) return 'bi bi-file-pdf text-danger';
      if (fileType.includes('word') || fileType.includes('document')) return 'bi bi-file-word text-primary';
      if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'bi bi-file-excel text-success';
      if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'bi bi-file-ppt text-warning';
      if (fileType.includes('image')) return 'bi bi-file-image text-info';
      if (fileType.includes('text')) return 'bi bi-file-text';
      
      return 'bi bi-file-earmark';
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

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

    formatDate(date) {
      if (!date) return 'Data não definida';
      try {
        return new Date(date).toLocaleDateString('pt-PT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return 'Data inválida';
      }
    },

    contactAdvisor() {
      const email = this.proposal.advisor?.email || 'joao.silva@universidade.pt';
      alert(`Contactar: ${email}\n\nEsta funcionalidade abriria o cliente de email.`);
    },

    printPage() {
      window.print();
    },

    applyToProject() {
      alert('Funcionalidade de candidatura ao projeto será implementada em breve.');
    },
  },
};
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.card-body {
  padding: 2rem;
}

h1 {
  color: #333;
  font-weight: 600;
}

.badge {
  font-size: 0.9rem;
  padding: 0.5em 1em;
}

.list-group-item {
  border-left: none;
  border-right: none;
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}

/* Files Section */
.file-item {
  border-left: 4px solid #0d6efd;
  transition: all 0.2s;
}

.file-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-icon {
  font-size: 2rem;
  color: #6c757d;
}

.file-actions .btn {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.file-actions .btn:hover {
  opacity: 1;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-dialog {
  max-width: 500px;
  width: 90%;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .file-item .d-flex {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .file-actions {
    margin-top: 10px;
    width: 100%;
    justify-content: flex-end;
  }
  
  .modal-dialog {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
}

@media print {
  .btn, .alert, .file-actions, .modal-overlay {
    display: none !important;
  }
}
</style>
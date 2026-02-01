<!-- src/views/proposals/CreateProposalView.vue -->
<template>
  <div class="create-proposal-view">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/proposals">Propostas</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Criar Nova Proposta</li>
      </ol>
    </nav>
    
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h2 mb-0">
        <i class="fas fa-plus-circle text-primary me-2"></i>
        Criar Nova Proposta
      </h1>
      <router-link to="/proposals" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-1"></i> Voltar
      </router-link>
    </div>
    
    <!-- Form -->
    <div class="card shadow">
      <div class="card-body p-4">
        <form @submit.prevent="submitProposal">
          <!-- Title -->
          <div class="mb-4">
            <label for="title" class="form-label fw-bold">Título da Proposta *</label>
            <input
              v-model="form.title"
              type="text"
              class="form-control form-control-lg"
              id="title"
              placeholder="Ex: Sistema Web para Gestão de Propostas de Projetos Finais"
              required
              :class="{ 'is-invalid': errors.title }"
            />
            <div v-if="errors.title" class="invalid-feedback">
              {{ errors.title }}
            </div>
          </div>
          
          <!-- Description -->
          <div class="mb-4">
            <label for="description" class="form-label fw-bold">Descrição *</label>
            <textarea
              v-model="form.description"
              class="form-control"
              id="description"
              rows="6"
              placeholder="Descreva detalhadamente o projeto, incluindo contexto, objetivos e metodologia..."
              required
              :class="{ 'is-invalid': errors.description }"
            ></textarea>
            <div class="form-text">
              Forneça uma descrição clara e completa do projeto.
            </div>
            <div v-if="errors.description" class="invalid-feedback">
              {{ errors.description }}
            </div>
          </div>
          
          <!-- Objectives -->
          <div class="mb-4">
            <label class="form-label fw-bold d-flex justify-content-between">
              <span>Objetivos *</span>
              <button
                type="button"
                @click="addObjective"
                class="btn btn-sm btn-outline-primary"
              >
                <i class="fas fa-plus me-1"></i> Adicionar
              </button>
            </label>
            
            <div v-for="(objective, index) in form.objectives" :key="index" class="mb-2">
              <div class="input-group">
                <input
                  v-model="form.objectives[index]"
                  type="text"
                  class="form-control"
                  :placeholder="`Objetivo ${index + 1}`"
                  required
                />
                <button
                  v-if="form.objectives.length > 1"
                  @click="removeObjective(index)"
                  type="button"
                  class="btn btn-outline-danger"
                  :disabled="loading"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div v-if="errors.objectives" class="invalid-feedback d-block">
              {{ errors.objectives }}
            </div>
          </div>
          
          <!-- Keywords -->
          <div class="mb-4">
            <label class="form-label fw-bold">Palavras-chave</label>
            <div class="input-group mb-2">
              <input
                v-model="newKeyword"
                @keydown.enter.prevent="addKeyword"
                type="text"
                class="form-control"
                placeholder="Adicionar palavra-chave (Enter para adicionar)"
              />
              <button
                @click="addKeyword"
                type="button"
                class="btn btn-outline-secondary"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
            
            <div v-if="form.keywords.length > 0" class="d-flex flex-wrap gap-2 mb-3">
              <span
                v-for="(keyword, index) in form.keywords"
                :key="index"
                class="badge bg-primary d-flex align-items-center"
              >
                {{ keyword }}
                <button
                  @click="removeKeyword(index)"
                  type="button"
                  class="btn-close btn-close-white ms-2"
                  style="font-size: 0.6rem;"
                ></button>
              </span>
            </div>
            <div v-else class="text-muted small">
              Nenhuma palavra-chave adicionada
            </div>
          </div>
          
          <!-- Academic Year -->
          <div class="mb-4">
            <label for="academic_year" class="form-label fw-bold">Ano Académico *</label>
            <input
              v-model="form.academic_year"
              type="text"
              class="form-control"
              id="academic_year"
              placeholder="Ex: 2024-2025"
              required
              :class="{ 'is-invalid': errors.academic_year }"
            />
            <div v-if="errors.academic_year" class="invalid-feedback">
              {{ errors.academic_year }}
            </div>
          </div>

          <!-- File Uploads Section -->
          <div class="mb-4">
            <label class="form-label fw-bold d-flex justify-content-between align-items-center">
              <span>Ficheiros Anexados (opcional)</span>
              <button
                type="button"
                @click="openFileUpload"
                class="btn btn-sm btn-outline-primary"
              >
                <i class="fas fa-paperclip me-1"></i> Adicionar Ficheiro
              </button>
            </label>
            
            <!-- Selected Files List -->
            <div v-if="form.files && form.files.length > 0" class="selected-files mt-3">
              <div class="card border">
                <div class="card-header bg-light py-2">
                  <small class="fw-bold">Ficheiros selecionados ({{ form.files.length }})</small>
                </div>
                <div class="card-body p-2">
                  <div v-for="(file, index) in form.files" :key="index" class="file-item border-bottom py-2">
                    <div class="d-flex align-items-center">
                      <div class="file-icon me-3">
                        <i :class="getFileIcon(file.type)"></i>
                      </div>
                      <div class="file-info flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <strong class="d-block">{{ file.name }}</strong>
                            <small class="text-muted">
                              {{ formatFileSize(file.size) }}
                              <span v-if="file.description"> • {{ file.description }}</span>
                            </small>
                          </div>
                          <div class="file-actions">
                            <button
                              type="button"
                              @click="editFile(index)"
                              class="btn btn-sm btn-outline-secondary me-1"
                              title="Editar descrição"
                            >
                              <i class="fas fa-edit"></i>
                            </button>
                            <button
                              type="button"
                              @click="removeFile(index)"
                              class="btn btn-sm btn-outline-danger"
                              title="Remover"
                            >
                              <i class="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        <div v-if="file.category" class="mt-1">
                          <small class="badge me-1" :class="getCategoryBadgeClass(file.category)">
                            {{ getCategoryDisplayName(file.category) }}
                          </small>
                          <small class="badge" :class="getAccessLevelBadgeClass(file.access_level)">
                            <i class="fas" :class="getAccessLevelIcon(file.access_level)"></i>
                            {{ getAccessLevelDisplayName(file.access_level) }}
                          </small>
                        </div>
                        <div v-if="file.tags && file.tags.length > 0" class="mt-1">
                          <small 
                            v-for="(tag, tagIndex) in file.tags" 
                            :key="tagIndex" 
                            class="badge bg-light text-dark me-1"
                          >
                            {{ tag }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-muted small">
              Nenhum ficheiro adicionado. Pode adicionar documentos de suporte como PDF, imagens, etc.
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="d-flex justify-content-end gap-2 pt-3 border-top">
            <router-link to="/proposals" class="btn btn-outline-secondary">
              Cancelar
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <template v-if="loading">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                A criar...
              </template>
              <template v-else>
                <i class="fas fa-save me-2"></i>
                Criar Proposta
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- File Upload Modal -->
    <div v-if="showFileUploadModal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-paperclip me-2"></i>
              Adicionar Ficheiro
            </h5>
            <button type="button" class="btn-close" @click="closeFileUploadModal"></button>
          </div>
          <div class="modal-body">
            <!-- File Selection -->
            <div class="mb-4">
              <label class="form-label fw-bold">Selecionar Ficheiro *</label>
              <div class="input-group">
                <input
                  type="file"
                  class="form-control"
                  ref="fileInput"
                  @change="handleFileSelect"
                  :accept="allowedFileTypes.join(',')"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="triggerFileInput"
                >
                  <i class="fas fa-folder-open"></i>
                </button>
              </div>
              <div class="form-text">
                Tipos permitidos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, GIF
                <br>Tamanho máximo: 10MB por ficheiro
              </div>
            </div>

            <!-- File Preview -->
            <div v-if="currentFile" class="mb-4">
              <label class="form-label fw-bold">Pré-visualização</label>
              <div class="card">
                <div class="card-body">
                  <div class="d-flex align-items-center">
                    <div class="file-icon me-3 fs-3">
                      <i :class="getFileIcon(currentFile.type)"></i>
                    </div>
                    <div class="flex-grow-1">
                      <h6 class="mb-1">{{ currentFile.name }}</h6>
                      <small class="text-muted d-block">
                        Tamanho: {{ formatFileSize(currentFile.size) }}
                      </small>
                      <small class="text-muted d-block">
                        Tipo: {{ currentFile.type || 'Desconhecido' }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- File Category -->
            <div class="mb-4">
              <label for="fileCategory" class="form-label fw-bold">Categoria *</label>
              <select
                v-model="fileCategory"
                class="form-select"
                id="fileCategory"
                required
              >
                <option value="">Selecionar categoria...</option>
                <option value="proposal_document">Documento da Proposta</option>
                <option value="technical_specification">Especificação Técnica</option>
                <option value="requirements_document">Documento de Requisitos</option>
                <option value="architecture_diagram">Diagrama de Arquitetura</option>
                <option value="timeline">Cronograma</option>
                <option value="presentation">Apresentação</option>
                <option value="reference_material">Material de Referência</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <!-- File Description -->
            <div class="mb-4">
              <label for="fileDescription" class="form-label fw-bold">Descrição (opcional)</label>
              <textarea
                v-model="fileDescription"
                class="form-control"
                id="fileDescription"
                rows="2"
                placeholder="Ex: Documento técnico detalhando a arquitetura do sistema..."
                maxlength="500"
              ></textarea>
              <div class="form-text">
                Breve descrição do conteúdo do ficheiro
              </div>
            </div>

            <!-- File Tags -->
            <div class="mb-4">
              <label class="form-label fw-bold">Etiquetas (opcional)</label>
              <div class="input-group mb-2">
                <input
                  v-model="newTag"
                  @keydown.enter.prevent="addTag"
                  type="text"
                  class="form-control"
                  placeholder="Adicionar etiqueta (Enter para adicionar)"
                />
                <button
                  @click="addTag"
                  type="button"
                  class="btn btn-outline-secondary"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              
              <div v-if="fileTags.length > 0" class="d-flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in fileTags"
                  :key="index"
                  class="badge bg-secondary d-flex align-items-center"
                >
                  {{ tag }}
                  <button
                    @click="removeTag(index)"
                    type="button"
                    class="btn-close btn-close-white ms-2"
                    style="font-size: 0.6rem;"
                  ></button>
                </span>
              </div>
            </div>

            <!-- Access Level -->
            <div class="mb-4">
              <label class="form-label fw-bold">Nível de Acesso *</label>
              <div class="row">
                <div class="col-6">
                  <div class="form-check card h-100 border" :class="{ 'border-primary': fileAccessLevel === 'private' }">
                    <div class="card-body text-center">
                      <input
                        class="form-check-input"
                        type="radio"
                        v-model="fileAccessLevel"
                        value="private"
                        id="accessPrivate"
                        required
                      >
                      <label class="form-check-label d-block mt-2" for="accessPrivate">
                        <i class="fas fa-lock fa-2x text-secondary mb-2"></i>
                        <h6 class="fw-bold">Privado</h6>
                        <small class="text-muted d-block">
                          Apenas você e o orientador
                        </small>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-check card h-100 border" :class="{ 'border-primary': fileAccessLevel === 'public' }">
                    <div class="card-body text-center">
                      <input
                        class="form-check-input"
                        type="radio"
                        v-model="fileAccessLevel"
                        value="public"
                        id="accessPublic"
                      >
                      <label class="form-check-label d-block mt-2" for="accessPublic">
                        <i class="fas fa-globe fa-2x text-primary mb-2"></i>
                        <h6 class="fw-bold">Público</h6>
                        <small class="text-muted d-block">
                          Visível para todos
                        </small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Is Public Checkbox -->
            <div class="mb-4">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="isFilePublic"
                  id="isPublicCheck"
                >
                <label class="form-check-label" for="isPublicCheck">
                  <i class="fas fa-eye me-1"></i>
                  Tornar público para visualização
                </label>
              </div>
              <div class="form-text">
                Se marcado, o ficheiro será visível para todos os utilizadores do sistema
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeFileUploadModal"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="addFileToForm"
              :disabled="!currentFile || !fileCategory"
            >
              <i class="fas fa-plus me-1"></i>
              Adicionar Ficheiro
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { proposalsApi } from '@/api/proposals';
import api from '@/api'; // Assuming you have an api instance

export default {
  name: 'CreateProposalView',
  data() {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    return {
      form: {
        title: '',
        description: '',
        objectives: [''],
        keywords: [],
        academic_year: `${currentYear}-${nextYear}`,
        files: [], // Files to be uploaded after proposal creation
      },
      newKeyword: '',
      loading: false,
      errors: {},
      
      // File upload related data
      showFileUploadModal: false,
      currentFile: null,
      fileCategory: '',
      fileDescription: '',
      fileTags: [],
      newTag: '',
      fileAccessLevel: 'private',
      isFilePublic: false,
      editingFileIndex: null,
      
      // File validation
      allowedFileTypes: [
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
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
    };
  },
  methods: {
    addObjective() {
      this.form.objectives.push('');
    },
    
    removeObjective(index) {
      this.form.objectives.splice(index, 1);
    },
    
    addKeyword() {
      const keyword = this.newKeyword.trim();
      if (keyword && !this.form.keywords.includes(keyword)) {
        this.form.keywords.push(keyword);
        this.newKeyword = '';
      }
    },
    
    removeKeyword(index) {
      this.form.keywords.splice(index, 1);
    },
    
    // File upload methods
    openFileUpload() {
      this.showFileUploadModal = true;
      this.editingFileIndex = null;
      this.resetFileForm();
    },
    
    closeFileUploadModal() {
      this.showFileUploadModal = false;
      this.resetFileForm();
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        alert(`Ficheiro muito grande. Tamanho máximo: ${this.formatFileSize(this.maxFileSize)}`);
        event.target.value = '';
        return;
      }
      
      // Validate file type
      if (!this.allowedFileTypes.includes(file.type)) {
        alert('Tipo de ficheiro não permitido. Por favor, selecione um ficheiro do tipo: PDF, Word, Excel, PowerPoint ou imagem.');
        event.target.value = '';
        return;
      }
      
      this.currentFile = file;
    },
    
    addTag() {
      const tag = this.newTag.trim();
      if (tag && !this.fileTags.includes(tag)) {
        this.fileTags.push(tag);
        this.newTag = '';
      }
    },
    
    removeTag(index) {
      this.fileTags.splice(index, 1);
    },
    
    addFileToForm() {
      if (!this.currentFile || !this.fileCategory) {
        alert('Por favor, selecione um ficheiro e uma categoria.');
        return;
      }
      
      // Create file object
      const fileObject = {
        file: this.currentFile,
        name: this.currentFile.name,
        size: this.currentFile.size,
        type: this.currentFile.type,
        category: this.fileCategory,
        description: this.fileDescription.trim(),
        tags: [...this.fileTags],
        access_level: this.fileAccessLevel,
        is_public: this.isFilePublic
      };
      
      // Check if editing existing file
      if (this.editingFileIndex !== null) {
        this.form.files[this.editingFileIndex] = fileObject;
      } else {
        // Add new file
        this.form.files.push(fileObject);
      }
      
      // Close modal and reset
      this.closeFileUploadModal();
    },
    
    editFile(index) {
      const file = this.form.files[index];
      this.currentFile = file.file || file;
      this.fileCategory = file.category || '';
      this.fileDescription = file.description || '';
      this.fileTags = file.tags ? [...file.tags] : [];
      this.fileAccessLevel = file.access_level || 'private';
      this.isFilePublic = file.is_public || false;
      this.editingFileIndex = index;
      this.showFileUploadModal = true;
    },
    
    removeFile(index) {
      if (confirm('Tem certeza que deseja remover este ficheiro?')) {
        this.form.files.splice(index, 1);
      }
    },
    
    resetFileForm() {
      this.currentFile = null;
      this.fileCategory = '';
      this.fileDescription = '';
      this.fileTags = [];
      this.newTag = '';
      this.fileAccessLevel = 'private';
      this.isFilePublic = false;
      this.editingFileIndex = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    // File helper methods
    getFileIcon(fileType) {
      if (!fileType) return 'fas fa-file';
      
      if (fileType.includes('pdf')) return 'fas fa-file-pdf text-danger';
      if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word text-primary';
      if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel text-success';
      if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fas fa-file-powerpoint text-warning';
      if (fileType.includes('image')) return 'fas fa-file-image text-info';
      if (fileType.includes('text')) return 'fas fa-file-alt';
      
      return 'fas fa-file';
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    getCategoryBadgeClass(category) {
      const classes = {
        proposal_document: 'bg-primary',
        technical_specification: 'bg-info',
        requirements_document: 'bg-success',
        architecture_diagram: 'bg-warning',
        timeline: 'bg-purple',
        presentation: 'bg-pink',
        reference_material: 'bg-secondary',
        other: 'bg-dark'
      };
      return classes[category] || 'bg-secondary';
    },
    
    getCategoryDisplayName(category) {
      const names = {
        proposal_document: 'Documento',
        technical_specification: 'Especificação Técnica',
        requirements_document: 'Requisitos',
        architecture_diagram: 'Diagrama',
        timeline: 'Cronograma',
        presentation: 'Apresentação',
        reference_material: 'Referência',
        other: 'Outro'
      };
      return names[category] || category;
    },
    
    getAccessLevelBadgeClass(accessLevel) {
      return accessLevel === 'public' ? 'bg-success' : 'bg-secondary';
    },
    
    getAccessLevelIcon(accessLevel) {
      return accessLevel === 'public' ? 'fa-globe' : 'fa-lock';
    },
    
    getAccessLevelDisplayName(accessLevel) {
      return accessLevel === 'public' ? 'Público' : 'Privado';
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      // Title validation
      if (!this.form.title.trim()) {
        this.errors.title = 'O título é obrigatório';
        isValid = false;
      }
      
      // Description validation
      if (!this.form.description.trim()) {
        this.errors.description = 'A descrição é obrigatória';
        isValid = false;
      }
      
      // Objectives validation
      const validObjectives = this.form.objectives.filter(obj => obj.trim() !== '');
      if (validObjectives.length === 0) {
        this.errors.objectives = 'Adicione pelo menos um objetivo';
        isValid = false;
      }
      
      // Academic year validation
      const yearRegex = /^\d{4}-\d{4}$/;
      if (!yearRegex.test(this.form.academic_year)) {
        this.errors.academic_year = 'Formato inválido. Use: 2024-2025';
        isValid = false;
      }
      
      return isValid;
    },
    
    async uploadFilesSequentially(proposalId) {
      const uploadPromises = [];
      
      for (const fileObj of this.form.files) {
        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('proposal_id', proposalId);
        formData.append('category', fileObj.category);
        
        if (fileObj.description) {
          formData.append('description', fileObj.description);
        }
        
        if (fileObj.tags && fileObj.tags.length > 0) {
          formData.append('tags', fileObj.tags.join(','));
        }
        
        formData.append('access_level', fileObj.access_level);
        formData.append('is_public', fileObj.is_public.toString());
        
        uploadPromises.push(
          api.post('/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).catch(error => {
            console.error('Error uploading file:', error);
            throw error;
          })
        );
      }
      
      return Promise.all(uploadPromises);
    },
    
    async submitProposal() {
      if (!this.validateForm()) {
        return;
      }
      
      this.loading = true;
      
      try {
        // Get user ID from wherever it's stored
        const userId = localStorage.getItem('user_id') || 
                      this.$store?.state?.auth?.user?._id || 
                      this.$store?.state?.auth?.user?.id;
        
        // Prepare proposal payload
        const payload = {
          ...this.form,
          objectives: this.form.objectives.filter(obj => obj.trim() !== ''),
          createdBy: userId,
        };
        
        // Remove files from payload (they'll be uploaded separately)
        delete payload.files;
        
        // Step 1: Create proposal
        const response = await proposalsApi.createProposal(payload);
        const proposalId = response.data.data.proposal._id;
        
        // Step 2: Upload files if any
        if (this.form.files.length > 0) {
          try {
            await this.uploadFilesSequentially(proposalId);
            console.log('All files uploaded successfully');
          } catch (fileError) {
            // Even if file upload fails, proposal was created successfully
            console.warn('Some files failed to upload, but proposal was created');
            // Show warning but continue
            this.$toast.warning('Proposta criada, mas alguns ficheiros não foram enviados.', {
              position: 'top-right',
              timeout: 5000,
            });
          }
        }
        
        // Success - redirect to proposal detail
        this.$router.push({
          name: 'ProposalDetail',
          params: { id: proposalId },
        });
        
        // Show success message
        this.$toast.success('Proposta criada com sucesso!', {
          position: 'top-right',
          timeout: 3000,
        });
        
      } catch (error) {
        console.error('Error creating proposal:', error);
        
        // Handle validation errors from server
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors;
        } else {
          this.$toast.error(
            error.response?.data?.error || 'Erro ao criar proposta. Tente novamente.',
            {
              position: 'top-right',
              timeout: 5000,
            }
          );
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.create-proposal-view {
  max-width: 800px;
  margin: 0 auto;
}

.form-control-lg {
  font-size: 1.1rem;
}

.badge {
  padding: 0.5em 0.8em;
  font-size: 0.9rem;
}

.btn-close {
  opacity: 0.7;
}

.btn-close:hover {
  opacity: 1;
}

/* File upload styles */
.file-icon {
  font-size: 1.5rem;
  color: #6c757d;
  min-width: 40px;
  text-align: center;
}

.file-item {
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.file-actions .btn {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.file-actions .btn:hover {
  opacity: 1;
}

/* Custom badge colors */
.bg-purple {
  background-color: #6f42c1 !important;
  color: white;
}

.bg-pink {
  background-color: #e83e8c !important;
  color: white;
}

/* Modal styles */
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
  padding: 1rem;
}

.modal-dialog {
  max-width: 600px;
  width: 100%;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  position: sticky;
  bottom: 0;
  background: white;
}

.form-check .card {
  cursor: pointer;
  transition: all 0.2s;
}

.form-check .card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-check .card.border-primary {
  border-color: #0d6efd !important;
  border-width: 2px;
}

.form-check-input {
  position: absolute;
  top: 10px;
  left: 10px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .create-proposal-view {
    padding: 0 1rem;
  }
  
  .modal-dialog {
    margin: 0;
  }
  
  .file-item .d-flex {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .file-actions {
    margin-top: 10px;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
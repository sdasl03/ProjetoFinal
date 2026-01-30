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
  </div>
</template>

<script>
import { proposalsApi } from '@/api/proposals';

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
      },
      newKeyword: '',
      loading: false,
      errors: {},
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
    
    async submitProposal() {
      if (!this.validateForm()) {
        return;
      }
      
      this.loading = true;
      
      try {
        // Prepare payload
        const payload = {
          ...this.form,
          objectives: this.form.objectives.filter(obj => obj.trim() !== ''),
        };
        
        const response = await proposalsApi.createProposal(payload);
        
        // Success - redirect to proposal detail
        this.$router.push({
          name: 'ProposalDetail',
          params: { id: response.data.data.proposal._id },
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
</style>
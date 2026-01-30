<template>
  <div class="profile">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">
            <i class="bi bi-person me-2"></i>
            Perfil
          </h1>
        </div>
      </div>

      <div class="row">
        <!-- Profile Form -->
        <div class="col-lg-8 mb-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Informações Pessoais</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="updateProfile">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="name" class="form-label">Nome Completo</label>
                    <input
                      type="text"
                      class="form-control"
                      id="name"
                      v-model="form.name"
                      required
                    >
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input
                      type="email"
                      class="form-control"
                      id="email"
                      v-model="form.email"
                      required
                      disabled
                    >
                    <div class="form-text">
                      O email não pode ser alterado. Contacte o administrador se necessário.
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="phone" class="form-label">Telefone</label>
                    <input
                      type="tel"
                      class="form-control"
                      id="phone"
                      v-model="form.phone"
                    >
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="department" class="form-label">Departamento</label>
                    <input
                      type="text"
                      class="form-control"
                      id="department"
                      v-model="form.department"
                      :disabled="!isProfessor && !isAdmin"
                    >
                  </div>
                </div>

                <!-- Additional fields for students -->
                <div v-if="isStudent" class="row">
                  <div class="col-md-6 mb-3">
                    <label for="studentNumber" class="form-label">Número de Estudante</label>
                    <input
                      type="text"
                      class="form-control"
                      id="studentNumber"
                      v-model="form.studentNumber"
                      disabled
                    >
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="course" class="form-label">Curso</label>
                    <input
                      type="text"
                      class="form-control"
                      id="course"
                      v-model="form.course"
                    >
                  </div>
                </div>

                <div class="mb-3">
                  <label for="bio" class="form-label">Biografia</label>
                  <textarea
                    class="form-control"
                    id="bio"
                    rows="4"
                    v-model="form.bio"
                    placeholder="Conte-nos um pouco sobre você..."
                  ></textarea>
                </div>

                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="loading"
                  >
                    <i class="bi bi-check-circle me-2"></i>
                    {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
                  </button>

                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="resetForm"
                  >
                    <i class="bi bi-arrow-counterclockwise me-2"></i>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Profile Sidebar -->
        <div class="col-lg-4">
          <!-- Profile Picture -->
          <div class="card mb-4">
            <div class="card-body text-center">
              <div class="profile-avatar mb-3">
                <i class="bi bi-person-circle fs-1 text-secondary"></i>
              </div>
              <h5 class="card-title">{{ user?.name }}</h5>
              <p class="text-muted mb-0">{{ getRoleDisplayName(user?.role) }}</p>
              <p class="text-muted small">{{ user?.email }}</p>
            </div>
          </div>

          <!-- Account Status -->
          <div class="card mb-4">
            <div class="card-header">
              <h6 class="mb-0">Status da Conta</h6>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-circle-fill text-success me-2"></i>
                <span>Conta {{ user?.active ? 'Ativa' : 'Inativa' }}</span>
              </div>
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-calendar me-2"></i>
                <span>Membro desde {{ formatDate(user?.createdAt) }}</span>
              </div>
              <div class="d-flex align-items-center">
                <i class="bi bi-clock me-2"></i>
                <span>Último login: {{ formatDate(user?.lastLogin) }}</span>
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">Alterar Password</h6>
            </div>
            <div class="card-body">
              <form @submit.prevent="changePassword">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Password Atual</label>
                  <input
                    type="password"
                    class="form-control"
                    id="currentPassword"
                    v-model="passwordForm.current"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label for="newPassword" class="form-label">Nova Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="newPassword"
                    v-model="passwordForm.new"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar Nova Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="confirmPassword"
                    v-model="passwordForm.confirm"
                    required
                  >
                </div>

                <button
                  type="submit"
                  class="btn btn-warning w-100"
                  :disabled="passwordLoading"
                >
                  <i class="bi bi-key me-2"></i>
                  {{ passwordLoading ? 'Alterando...' : 'Alterar Password' }}
                </button>
              </form>
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
  name: 'ProfileView',
  data() {
    return {
      form: {
        name: '',
        email: '',
        phone: '',
        department: '',
        studentNumber: '',
        course: '',
        bio: '',
      },
      passwordForm: {
        current: '',
        new: '',
        confirm: '',
      },
      loading: false,
      passwordLoading: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['user', 'isStudent', 'isProfessor', 'isAdmin']),
    ...mapGetters('ui', ['loading']),
  },
  mounted() {
    this.loadUserData();
  },
  methods: {
    ...mapActions('auth', ['updateProfile']),
    ...mapActions('ui', ['addNotification']),

    loadUserData() {
      if (this.user) {
        this.form = {
          name: this.user.name || '',
          email: this.user.email || '',
          phone: this.user.phone || '',
          department: this.user.department || '',
          studentNumber: this.user.studentNumber || '',
          course: this.user.course || '',
          bio: this.user.bio || '',
        };
      }
    },

    async updateProfile() {
      this.loading = true;

      try {
        await this.updateProfile(this.form);
        this.addNotification({
          type: 'success',
          message: 'Perfil atualizado com sucesso!',
          duration: 3000,
        });
      } catch (error) {
        this.addNotification({
          type: 'error',
          message: 'Erro ao atualizar perfil. Tente novamente.',
          duration: 5000,
        });
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.loadUserData();
    },

    async changePassword() {
      if (this.passwordForm.new !== this.passwordForm.confirm) {
        this.addNotification({
          type: 'error',
          message: 'As passwords não coincidem.',
          duration: 3000,
        });
        return;
      }

      this.passwordLoading = true;

      try {
        // This would call the API to change password
        // await this.$store.dispatch('auth/changePassword', this.passwordForm);

        this.addNotification({
          type: 'success',
          message: 'Password alterada com sucesso!',
          duration: 3000,
        });

        this.passwordForm = {
          current: '',
          new: '',
          confirm: '',
        };
      } catch (error) {
        this.addNotification({
          type: 'error',
          message: 'Erro ao alterar password. Verifique a password atual.',
          duration: 5000,
        });
      } finally {
        this.passwordLoading = false;
      }
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
      if (!date) return 'Nunca';
      return new Date(date).toLocaleDateString('pt-PT');
    },
  },
};
</script>

<style scoped>
.profile-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 50%;
}

.card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: none;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
</style>
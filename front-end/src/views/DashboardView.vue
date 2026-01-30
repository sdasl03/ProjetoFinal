<template>
  <div class="dashboard">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">
            <i class="bi bi-speedometer2 me-2"></i>
            Dashboard
          </h1>
        </div>
      </div>

      <!-- Welcome Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card welcome-card">
            <div class="card-body">
              <h5 class="card-title">
                Welcome back, {{ user?.name || 'User' }}!
              </h5>
              <p class="card-text">
                Here's an overview of your account and recent activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-primary">
                  <i class="bi bi-file-earmark-text"></i>
                </div>
                <div class="ms-3">
                  <h6 class="card-title mb-0">My Proposals</h6>
                  <h3 class="mb-0">{{ stats.proposals }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-3">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-success">
                  <i class="bi bi-check-circle"></i>
                </div>
                <div class="ms-3">
                  <h6 class="card-title mb-0">Approved</h6>
                  <h3 class="mb-0">{{ stats.approved }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-3">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-warning">
                  <i class="bi bi-clock"></i>
                </div>
                <div class="ms-3">
                  <h6 class="card-title mb-0">Pending</h6>
                  <h3 class="mb-0">{{ stats.pending }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-3">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-info">
                  <i class="bi bi-people"></i>
                </div>
                <div class="ms-3">
                  <h6 class="card-title mb-0">Applications</h6>
                  <h3 class="mb-0">{{ stats.applications }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="row">
        <div class="col-md-8 mb-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Recent Activity</h5>
            </div>
            <div class="card-body">
              <div v-if="recentActivity.length === 0" class="text-center text-muted">
                <i class="bi bi-info-circle fs-1 mb-3"></i>
                <p>No recent activity</p>
              </div>
              <div v-else class="activity-list">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="activity-item d-flex align-items-center mb-3"
                >
                  <div class="activity-icon me-3">
                    <i :class="activity.icon" class="text-primary"></i>
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-0">{{ activity.message }}</p>
                    <small class="text-muted">{{ formatDate(activity.date) }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <router-link
                  v-if="isProfessor || isAdmin"
                  to="/proposals/create"
                  class="btn btn-primary"
                >
                  <i class="bi bi-plus-circle me-2"></i>
                  Create Proposal
                </router-link>

                <router-link to="/proposals" class="btn btn-outline-primary">
                  <i class="bi bi-list me-2"></i>
                  View Proposals
                </router-link>

                <router-link to="/profile" class="btn btn-outline-secondary">
                  <i class="bi bi-person me-2"></i>
                  Edit Profile
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'DashboardView',
  computed: {
    ...mapGetters('auth', ['user', 'isProfessor', 'isAdmin']),
    stats() {
      return {
        proposals: 0,
        approved: 0,
        pending: 0,
        applications: 0,
      };
    },
    recentActivity() {
      return [
        // This would be populated from the API
      ];
    },
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
  },
  mounted() {
    // Load dashboard data
    this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      try {
        // This would load actual data from the API
        // For now, just set some placeholder data
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    },
  },
};
</script>

<style scoped>
.dashboard {
  padding: 2rem 0;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.stats-card {
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.activity-item {
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

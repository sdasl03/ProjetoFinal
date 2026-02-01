<template>
  <MainLayout/>
</template>

<script>
import MainLayout from './layouts/MainLayout.vue';

export default {
  name: 'App',
  components: {
    MainLayout,
  },
  created() {
    // Fetch current user on app start if token exists
    if (this.$store.state.auth.isAuthenticated) {
      this.$store.dispatch('auth/fetchCurrentUser').catch(() => {
        // Silent error - will be handled by interceptor
      });
    }
  },
};
</script>

<style>
#app {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

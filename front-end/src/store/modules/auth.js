// src/store/modules/auth.js
import api from '@/api';
import router from '@/router';

export default {
  namespaced: true,

  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false
  }),

 mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    
    SET_TOKEN(state, token) {
      state.token = token;
    },
    
    SET_AUTHENTICATED(state, value) {
      state.isAuthenticated = value;
    },
    
    LOGOUT(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await api.post('/auth/login', credentials);
        const { user, token } = response.data.data;
        
        // Save to localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        // Commit to Vuex
        commit('SET_AUTH', { user, token });
        
        // Redirect
        router.push('/dashboard');
        
        return { success: true, user };
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    
    async logout({ commit, state }) {
      try {
        // Optional: Call logout API if it exists
        if (state.token) {
          try {
            await api.post('/auth/logout', {}, {
              headers: { Authorization: `Bearer ${state.token}` }
            });
          } catch (apiError) {
            console.warn('Logout API call failed, proceeding with client cleanup:', apiError.message);
          }
        }
      } finally {
        // Always perform client-side cleanup
        this.clearAuthData(commit);
        
        // Redirect to login
        router.push('/login');
        
        return true;
      }
    },
    
    clearAuthData(commit) {
      // Clear all possible auth storage
      const authKeys = [
        'auth_token', 'token', 'access_token',
        'user_data', 'user', 'currentUser',
        'user_id', 'refresh_token'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Clear Vuex state
      if (commit) commit('LOGOUT');
    },
    
    checkAuth({ commit }) {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          commit('SET_AUTH', { user, token });
          return true;
        } catch (e) {
          this.clearAuthData(commit);
          return false;
        }
      }
      return false;
    }
  },
  
  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => state.isAuthenticated,
    authToken: (state) => state.token
  }
};
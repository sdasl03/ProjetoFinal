// src/store/modules/auth.js
import { authApi } from '@/api/auth';

const state = {
  user: JSON.parse(localStorage.getItem('user_data')) || null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  loading: false,
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_AUTHENTICATED(state, value) {
    state.isAuthenticated = value;
  },
  SET_LOADING(state, value) {
    state.loading = value;
  },
  CLEAR_AUTH(state) {
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
  },
};

const actions = {
  async login({ commit }, credentials) {
    commit('SET_LOADING', true);
    try {
      const response = await authApi.login(credentials);
      const { token, refreshToken, user } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      // Commit to state
      commit('SET_TOKEN', token);
      commit('SET_USER', user);
      commit('SET_AUTHENTICATED', true);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async register({ commit }, userData) {
    commit('SET_LOADING', true);
    try {
      const response = await authApi.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchCurrentUser({ commit, state }) {
    try {
      const response = await authApi.getMe();
      const user = response.data.data.user;
      localStorage.setItem('user_data', JSON.stringify(user));
      commit('SET_USER', user);
      return user;
    } catch (error) {
      // If error, clear auth
      commit('CLEAR_AUTH');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      throw error;
    }
  },
  
  logout({ commit }) {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Clear state
    commit('CLEAR_AUTH');
    
    // Redirect to login
    window.location.href = '/login';
  },
};

const getters = {
  isFaculty: (state) => state.user?.type === 'FACULTY',
  isStudent: (state) => state.user?.type === 'STUDENT',
  isAdmin: (state) => state.user?.type === 'ADMIN',
  userFullName: (state) => state.user?.full_name || '',
  userType: (state) => state.user?.type || null,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
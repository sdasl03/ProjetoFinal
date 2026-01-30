// src/store/modules/auth.js
import axios from 'axios';

const state = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const getters = {
  isAuthenticated: (state) => state.isAuthenticated,
  user: (state) => state.user,
  token: (state) => state.token,
  loading: (state) => state.loading,
  error: (state) => state.error,
  userRole: (state) => state.user?.role || null,
  isAdmin: (state) => state.user?.role === 'admin',
  isProfessor: (state) => state.user?.role === 'professor',
  isStudent: (state) => state.user?.role === 'student',
  isCoAdvisor: (state) => state.user?.role === 'coadvisor',
};

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_USER(state, user) {
    state.user = user;
    state.isAuthenticated = !!user;
  },
  SET_TOKEN(state, token) {
    state.token = token;
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  },
  LOGOUT(state) {
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
    state.error = null;
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  },
  CLEAR_ERROR(state) {
    state.error = null;
  },
};

const actions = {
  async login({ commit }, credentials) {
    commit('SET_LOADING', true);
    commit('CLEAR_ERROR');

    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { user, token } = response.data.data;

      commit('SET_TOKEN', token);
      commit('SET_USER', user);

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      commit('SET_ERROR', errorMessage);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async register({ commit }, userData) {
    commit('SET_LOADING', true);
    commit('CLEAR_ERROR');

    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      commit('SET_ERROR', errorMessage);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async logout({ commit }) {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      commit('LOGOUT');
    }
  },

  async checkAuth({ commit }) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      commit('SET_TOKEN', token);
      const response = await axios.get('/api/auth/me');
      commit('SET_USER', response.data.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      commit('LOGOUT');
    }
  },

  async updateProfile({ commit }, userData) {
    commit('SET_LOADING', true);
    commit('CLEAR_ERROR');

    try {
      const response = await axios.put('/api/users/profile', userData);
      commit('SET_USER', response.data.data.user);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      commit('SET_ERROR', errorMessage);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  clearError({ commit }) {
    commit('CLEAR_ERROR');
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
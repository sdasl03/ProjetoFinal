// src/store/modules/ui.js

const state = {
  sidebarOpen: false,
  loading: false,
  notifications: [],
  modal: {
    show: false,
    component: null,
    props: {},
  },
  theme: 'light', // 'light' or 'dark'
};

const getters = {
  sidebarOpen: (state) => state.sidebarOpen,
  loading: (state) => state.loading,
  notifications: (state) => state.notifications,
  modal: (state) => state.modal,
  theme: (state) => state.theme,
  isDarkTheme: (state) => state.theme === 'dark',
};

const mutations = {
  TOGGLE_SIDEBAR(state) {
    state.sidebarOpen = !state.sidebarOpen;
  },
  SET_SIDEBAR(state, open) {
    state.sidebarOpen = open;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  ADD_NOTIFICATION(state, notification) {
    state.notifications.push({
      id: Date.now(),
      ...notification,
    });
  },
  REMOVE_NOTIFICATION(state, id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
  },
  CLEAR_NOTIFICATIONS(state) {
    state.notifications = [];
  },
  SHOW_MODAL(state, { component, props = {} }) {
    state.modal = {
      show: true,
      component,
      props,
    };
  },
  HIDE_MODAL(state) {
    state.modal = {
      show: false,
      component: null,
      props: {},
    };
  },
  SET_THEME(state, theme) {
    state.theme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },
};

const actions = {
  toggleSidebar({ commit }) {
    commit('TOGGLE_SIDEBAR');
  },
  setSidebar({ commit }, open) {
    commit('SET_SIDEBAR', open);
  },
  setLoading({ commit }, loading) {
    commit('SET_LOADING', loading);
  },
  addNotification({ commit }, notification) {
    commit('ADD_NOTIFICATION', notification);

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        commit('REMOVE_NOTIFICATION', notification.id);
      }, notification.duration || 5000);
    }
  },
  removeNotification({ commit }, id) {
    commit('REMOVE_NOTIFICATION', id);
  },
  clearNotifications({ commit }) {
    commit('CLEAR_NOTIFICATIONS');
  },
  showModal({ commit }, payload) {
    commit('SHOW_MODAL', payload);
  },
  hideModal({ commit }) {
    commit('HIDE_MODAL');
  },
  setTheme({ commit }, theme) {
    commit('SET_THEME', theme);
  },
  initializeTheme({ commit }) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    commit('SET_THEME', savedTheme);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
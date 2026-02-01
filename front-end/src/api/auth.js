// src/api/auth.js
import api from './index';

export const authApi = {
  // Register user
  register(userData) {
    return api.post('api/auth/register', userData);
  },

  // Login user
  login(credentials) {
    return api.post('api/auth/login', credentials);
  },

  // Get current user
  getMe() {
    return api.get('api/auth/me');
  },

  // Update profile
  updateProfile(data) {
    return api.put('api/auth/me', data);
  },

  // Change password
  changePassword(data) {
    return api.put('api/auth/change-password', data);
  },

  // Logout
  logout(refreshToken) {
    return api.post('api/auth/logout', { refreshToken });
  },
};
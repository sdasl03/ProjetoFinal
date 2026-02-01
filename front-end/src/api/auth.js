import api from './index';

export const authApi = {
  // Register user
  register(userData) {
    return api.post('auth/register', userData);
  },

  // Login user
  login(credentials) {
    return api.post('auth/login', credentials);
  },

  // Get current user
  getMe() {
    return api.get('auth/me');
  },

  // Update profile
  updateProfile(data) {
    return api.put('auth/me', data);
  },

  // Change password
  changePassword(data) {
    return api.put('auth/change-password', data);
  },

  // Logout
  logout(refreshToken) {
    return api.post('auth/logout', { refreshToken });
  },
};
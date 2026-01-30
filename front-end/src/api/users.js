// src/api/users.js
import api from './index';

export const usersApi = {
  // List users (admin/faculty only)
  getUsers(params) {
    return api.get('/users', { params });
  },

  // Get faculty list (public - no auth required)
  getFaculty() {
    return api.get('/users/faculty');
  },

  // Get user by ID
  getUserById(id) {
    return api.get(`/users/${id}`);
  },
};

// src/api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: process.env.VUE_APP_DEFAULT_TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export the axios instance
export default api;

// Export all API modules
export { authApi } from './auth';
export { usersApi } from './users';
export { proposalsApi } from './proposals';
export { filesApi } from './files';
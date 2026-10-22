import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lansphere_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and not already on auth page, redirect or clear token
      if (window.location.pathname !== '/auth') {
        localStorage.removeItem('lansphere_token');
        localStorage.removeItem('lansphere_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

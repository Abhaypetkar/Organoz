// src/services/api.js
import axios from 'axios';

const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: base,
});

// Attach tenant header and auth token from localStorage for all requests
api.interceptors.request.use(
  (config) => {
    try {
      const slug = localStorage.getItem('tenantSlug');
      if (slug) config.headers['x-tenant-slug'] = slug;

      const token = localStorage.getItem('authToken');
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // ignore localStorage errors in non-browser environments
      // console.warn('api interceptor localStorage read failed', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

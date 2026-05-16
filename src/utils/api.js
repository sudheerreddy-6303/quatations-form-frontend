import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').trim(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  // Keep X-API-Key as fallback during transition
  const apiKey = (process.env.REACT_APP_API_KEY || '').trim();
  if (apiKey) config.headers['X-API-Key'] = apiKey;
  return config;
});

// Handle 401 — session expired, redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('expired') || msg.includes('Authentication required')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // Reload to trigger login screen
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

export default api;

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
      // Only clear token and reload if it was a genuine session expiry
      // (not a first-load auth failure which would cause an infinite reload loop)
      if (msg.includes('expired')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.reload();
      }
      // For 'Authentication required.' — let the component handle it, don't auto-reload
    }
    return Promise.reject(err);
  }
);

export default api;
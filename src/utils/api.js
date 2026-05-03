import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').trim(),
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': (process.env.REACT_APP_API_KEY || '').trim(),
  },
});

export default api;
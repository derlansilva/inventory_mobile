import axios from 'axios';

// O Vite substitui o import.meta.env.VITE_API_URL pelo valor do arquivo .env correspondente
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1/';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
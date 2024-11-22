import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

export const todos = {
  getAll: async () => {
    const response = await api.get('/todos');
    return response.data;
  },
  create: async (todo) => {
    const response = await api.post('/todos', todo);
    return response.data;
  },
  update: async (id, todo) => {
    const response = await api.put(`/todos/${id}`, todo);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  },
};

export const notes = {
  getAll: async () => {
    const response = await api.get('/notes');
    console.log('Notes API response:', response);
    return response.data;
  },
  create: async (note) => {
    const response = await api.post('/notes', note);
    console.log('Notes API response:', response);
    return response.data;
  },
  update: async (id, note) => {
    const response = await api.put(`/notes/${id}`, note);
    console.log('Notes API response:', response);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    console.log('Notes API response:', response);
    return response.data;
  },
};

export const events = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  create: async (event) => {
    const response = await api.post('/events', event);
    return response.data;
  },
  update: async (id, event) => {
    const response = await api.put(`/events/${id}`, event);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

export const reminders = {
  getAll: async () => {
    const response = await api.get('/reminders');
    return response.data;
  },
  create: async (reminder) => {
    const response = await api.post('/reminders', reminder);
    return response.data;
  },
  update: async (id, reminder) => {
    const response = await api.put(`/reminders/${id}`, reminder);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },
};

export default api;

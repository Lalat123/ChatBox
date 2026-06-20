import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
  },

  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true });
    } catch (err) {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('token');
    }
  }
}));

export default useAuthStore;

// src/store/authStore.js
import { create } from 'zustand';

export const useAuthStore = create(
  (set) => ({
    user: null,
    isAuthenticated: false,
    token: null,
    login: (userData, token) => set({ user: userData, isAuthenticated: true, token: token || null }),
    logout: () => set({ user: null, isAuthenticated: false, token: null }),
    updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
  })
);

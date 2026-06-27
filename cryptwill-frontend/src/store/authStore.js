// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null, // Short-lived token for requests
      login: (userData, token) => {
        const resolvedRole = userData?.role || 'OWNER';
        set({ user: { ...userData, role: resolvedRole }, isAuthenticated: true, token });
      },
      logout: () => set({ user: null, isAuthenticated: false, token: null }),
      updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
    }),
    {
      name: 'cryptwill-auth', // Persist auth state
    }
  )
);

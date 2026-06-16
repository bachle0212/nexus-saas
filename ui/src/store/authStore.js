import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null, // { email, role, plan, permissions, display_name, avatar_url, credits, id }
      credits: 0,

      setAuth: (token, user) =>
        set({ token, user, credits: user?.credits ?? 0 }),

      setCredits: (credits) => set({ credits }),

      updateUser: (patch) =>
        set(state => ({ user: state.user ? { ...state.user, ...patch } : patch })),

      logout: () => set({ token: null, user: null, credits: 0 }),

      hasPerm: (perm) => {
        const perms = get().user?.permissions || '';
        if (Array.isArray(perms)) return perms.includes(perm);
        return perms.split(',').map(p => p.trim()).includes(perm);
      },
    }),
    { name: 'nexus_auth' }
  )
);

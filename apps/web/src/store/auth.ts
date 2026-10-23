import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User { id: string; name: string; email: string; phone?: string; role?: 'user' | 'admin' }

interface AuthState {
  /** Short-lived access token. Kept in memory only, never written to storage, so a script cannot read it later. */
  token: string | null;
  user: User | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  clear: () => void;
  setReady: (ready: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null, user: null, ready: false,
      setSession: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
      setReady: (ready) => set({ ready }),
    }),
    {
      name: 'tsa-auth', version: 2,
      partialize: (s) => ({ user: s.user }),
      migrate: (old: any) => ({ user: old?.user ?? null }), // drops any token an older version saved
    },
  ),
);

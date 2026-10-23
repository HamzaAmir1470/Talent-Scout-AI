import { create } from 'zustand';
import type { AuthMode } from '@/components/AuthModal';

interface UiState {
  authMode: AuthMode | null;
  openAuth: (m: AuthMode) => void;
  closeAuth: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  authMode: null,
  openAuth: (authMode) => set({ authMode }),
  closeAuth: () => set({ authMode: null }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));

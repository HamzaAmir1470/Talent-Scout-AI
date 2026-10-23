import { create } from 'zustand';

export interface Toast { id: number; kind: 'success' | 'error' | 'info'; text: string }
interface ToastState { items: Toast[]; push: (kind: Toast['kind'], text: string) => void; dismiss: (id: number) => void }

let n = 0;
export const useToast = create<ToastState>((set, get) => ({
  items: [],
  push: (kind, text) => {
    const id = ++n;
    set((s) => ({ items: [...s.items.slice(-3), { id, kind, text }] }));
    setTimeout(() => get().dismiss(id), 4500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (t: string) => useToast.getState().push('success', t),
  error: (t: string) => useToast.getState().push('error', t),
  info: (t: string) => useToast.getState().push('info', t),
};

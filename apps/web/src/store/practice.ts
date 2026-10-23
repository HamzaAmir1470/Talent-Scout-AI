import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Progress = 'known' | 'review';

interface PracticeState {
  bookmarks: Record<string, true>;
  progress: Record<string, Progress>;
  selfTest: boolean;
  toggleBookmark: (key: string) => void;
  setProgress: (key: string, value: Progress | null) => void;
  setSelfTest: (on: boolean) => void;
}

export const usePractice = create<PracticeState>()(
  persist(
    (set) => ({
      bookmarks: {},
      progress: {},
      selfTest: true,
      toggleBookmark: (key) =>
        set((s) => {
          const next = { ...s.bookmarks };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { bookmarks: next };
        }),
      setProgress: (key, value) =>
        set((s) => {
          const next = { ...s.progress };
          if (value) next[key] = value;
          else delete next[key];
          return { progress: next };
        }),
      setSelfTest: (selfTest) => set({ selfTest }),
    }),
    { name: 'tsa-practice' },
  ),
);

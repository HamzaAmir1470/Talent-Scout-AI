import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Progress = 'known' | 'review';

export interface SyncedPractice { bookmarks: string[]; progress: Record<string, Progress>; selfTest: boolean; updatedAt: number }

interface PracticeState {
  bookmarks: Record<string, true>;
  progress: Record<string, Progress>;
  selfTest: boolean;
  /** Time of the last local change. Used to decide whether this device or the account has the newer copy. */
  updatedAt: number;
  toggleBookmark: (key: string) => void;
  setProgress: (key: string, value: Progress | null) => void;
  setSelfTest: (on: boolean) => void;
  replaceAll: (data: SyncedPractice) => void;
}

export const usePractice = create<PracticeState>()(
  persist(
    (set) => ({
      bookmarks: {}, progress: {}, selfTest: true, updatedAt: 0,
      toggleBookmark: (key) =>
        set((s) => {
          const next = { ...s.bookmarks };
          if (next[key]) delete next[key]; else next[key] = true;
          return { bookmarks: next, updatedAt: Date.now() };
        }),
      setProgress: (key, value) =>
        set((s) => {
          const next = { ...s.progress };
          if (value) next[key] = value; else delete next[key];
          return { progress: next, updatedAt: Date.now() };
        }),
      setSelfTest: (selfTest) => set({ selfTest, updatedAt: Date.now() }),
      replaceAll: (d) => set({ bookmarks: Object.fromEntries(d.bookmarks.map((k) => [k, true as const])), progress: d.progress, selfTest: d.selfTest, updatedAt: d.updatedAt }),
    }),
    { name: 'tsa-practice' },
  ),
);

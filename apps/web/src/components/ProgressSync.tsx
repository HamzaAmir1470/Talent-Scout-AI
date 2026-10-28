'use client';
import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { usePractice } from '@/store/practice';

/** Keeps bookmarks and quiz progress in the user's account. The most recent change wins, so a second device picks up the first one's work. */
export default function ProgressSync() {
  const userId = useAuth((s) => s.user?.id);
  const hasToken = useAuth((s) => Boolean(s.token));
  const ready = useRef(false);
  const quiet = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const snapshot = () => {
    const s = usePractice.getState();
    return { bookmarks: Object.keys(s.bookmarks), progress: s.progress, selfTest: s.selfTest, updatedAt: s.updatedAt };
  };
  const adopt = (data: ReturnType<typeof snapshot>) => { quiet.current = true; usePractice.getState().replaceAll(data); quiet.current = false; };

  useEffect(() => {
    if (!userId || !hasToken) { ready.current = false; return; }
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/progress');
        if (data && data.updatedAt > usePractice.getState().updatedAt) adopt(data);
        else await api.put('/auth/progress', snapshot());
        if (!dead) ready.current = true;
      } catch { /* offline: local data still works and syncs next time */ }
    })();
    return () => { dead = true; };
  }, [userId, hasToken]);

  useEffect(() => usePractice.subscribe(() => {
    if (!ready.current || quiet.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api.put('/auth/progress', snapshot()).then((r) => { if (r.data?.conflict) adopt(r.data); }).catch(() => undefined);
    }, 1500);
  }), []);

  return null;
}

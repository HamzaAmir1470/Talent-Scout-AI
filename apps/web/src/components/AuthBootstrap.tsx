'use client';
import { useEffect } from 'react';
import { refreshSession } from '@/lib/api';
import { useAuth } from '@/store/auth';

/** Restores the session from the refresh cookie on load and keeps the short-lived access token fresh. */
export default function AuthBootstrap() {
  useEffect(() => {
    const s = useAuth.getState();
    (s.user ? refreshSession() : Promise.resolve(false)).finally(() => useAuth.getState().setReady(true));
    const timer = setInterval(() => { if (useAuth.getState().token) refreshSession(); }, 10 * 60_000);
    const onVisible = () => {
      const a = useAuth.getState();
      if (document.visibilityState === 'visible' && a.user && !a.token) refreshSession();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  return null;
}

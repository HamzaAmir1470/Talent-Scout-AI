'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useUi } from '@/store/ui';

export default function RequireAuth({ children, reason = 'continue', admin = false }: { children: React.ReactNode; reason?: string; admin?: boolean }) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const openAuth = useUi((s) => s.openAuth);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !ready) return <div className="mx-auto mt-24 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-brand" role="status" aria-label="Loading" />;
  if (!user) {
    return (
      <div className="card rise mx-auto mt-16 max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand"><Lock size={22} /></div>
        <h2 className="mt-4 text-xl font-semibold">Log in to {reason}</h2>
        <p className="mt-1 text-sm text-muted">It takes a few seconds and keeps your interviews and reports in one place.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-primary" onClick={() => openAuth('register')}>Create account</button>
          <button className="btn-ghost" onClick={() => openAuth('login')}>Log in</button>
        </div>
      </div>
    );
  }
  if (admin && user.role !== 'admin') {
    return (
      <div className="card mx-auto mt-16 max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto text-warn" size={30} />
        <h2 className="mt-4 text-xl font-semibold">Administrators only</h2>
        <p className="mt-1 text-sm text-muted">Your account does not have access to this area.</p>
        <Link href="/" className="btn-ghost mt-6">Back to home</Link>
      </div>
    );
  }
  return <>{children}</>;
}

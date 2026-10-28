'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { api, errorMessage } from '@/lib/api';
import { checkPassword } from '@/lib/password';
import { useUi } from '@/store/ui';

export default function ResetPassword() {
  const openAuth = useUi((s) => s.openAuth);
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') ?? ''); }, []);
  const check = useMemo(() => checkPassword(pw), [pw]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api.post('/auth/reset-password', { token, password: pw }); setDone(true); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-20">
        <div className="card p-8">
          {done ? (
            <div className="text-center" role="status">
              <CheckCircle2 className="mx-auto text-good" size={32} />
              <h1 className="mt-4 text-2xl font-semibold">Password updated</h1>
              <p className="mt-2 text-sm text-muted">You have been signed out everywhere. Log in with your new password.</p>
              <button className="btn-primary mt-6" onClick={() => openAuth('login')}>Log in</button>
            </div>
          ) : !token ? (
            <p className="text-center text-sm text-muted">This reset link is missing its code. Open the link from your email again, or <a className="link" href="/forgot-password">request a new one</a>.</p>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-2xl font-semibold">Choose a new password</h1>
              <label className="mt-6 block text-sm font-medium">New password
                <input className="input mt-1.5 font-normal" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required maxLength={72} autoFocus />
              </label>
              <ul className="mt-3 space-y-1 text-xs">
                {check.rules.map((r) => <li key={r.label} className={`flex items-center gap-1.5 ${r.ok ? 'text-good' : 'text-muted'}`}>{r.ok ? <Check size={12} /> : <Circle size={12} />}{r.label}</li>)}
              </ul>
              {error && <p role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
              <button className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-2.5" disabled={busy || !check.ok}>{busy && <Loader2 size={16} className="animate-spin" />} Update password</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import Header from '@/components/Header';
import { api, errorMessage } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api.post('/auth/forgot-password', { email: email.trim() }); setSent(true); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-20">
        <div className="card p-8">
          {sent ? (
            <div className="text-center" role="status">
              <MailCheck className="mx-auto text-brand" size={32} />
              <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted">If an account exists for <b className="text-ink">{email}</b>, we sent a link to choose a new password. It works for 30 minutes.</p>
              <Link href="/" className="btn-ghost mt-6">Back to home</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-2xl font-semibold">Reset your password</h1>
              <p className="mt-2 text-sm text-muted">Enter your email and we will send you a link to choose a new one.</p>
              <label className="mt-6 block text-sm font-medium">Email
                <input className="input mt-1.5 font-normal" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus maxLength={120} />
              </label>
              {error && <p role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
              <button className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-2.5" disabled={busy || !email}>{busy && <Loader2 size={16} className="animate-spin" />} Send reset link</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { COUNTRIES, guessCountry, toE164 } from '@/lib/countries';
import { checkPassword } from '@/lib/password';
import { useAuth } from '@/store/auth';
import Logo from './Logo';

export type AuthMode = 'login' | 'register';
const BAR = ['bg-line', 'bg-bad', 'bg-warn', 'bg-good', 'bg-good'];
const LABEL = ['', 'Too weak', 'Okay', 'Strong', 'Very strong'];

export default function AuthModal({ mode, onModeChange, onClose }: { mode: AuthMode; onModeChange: (m: AuthMode) => void; onClose: () => void }) {
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [country, setCountry] = useState('US');
  const [accept, setAccept] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = mode === 'register';

  useEffect(() => { setCountry(guessCountry()); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => setError(''), [mode]);

  const pw = useMemo(() => checkPassword(form.password, form.email), [form.password, form.email]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const dial = COUNTRIES.find(([c]) => c === country)?.[1] ?? '+1';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    let body: Record<string, unknown> = { email: form.email.trim(), password: form.password };
    if (register) {
      const phone = toE164(country, form.phone);
      if (!phone) return setError('Enter a valid phone number for the selected country.');
      if (!pw.ok) return setError('Choose a stronger password. Follow the checklist below the field.');
      if (!accept) return setError('Please accept the terms and privacy policy to continue.');
      body = { ...body, name: form.name.trim(), phone, acceptTerms: true };
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, body);
      setSession(data.accessToken, data.user);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:items-center" onMouseDown={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="card relative my-6 w-full max-w-md p-6 shadow-2xl sm:p-8" onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted hover:bg-subtle hover:text-ink"><X size={18} /></button>
        <Logo size={26} />
        <h2 id="auth-title" className="mt-5 text-2xl font-semibold">{register ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mt-1 text-sm text-muted">{register ? 'Free to start. No card needed.' : 'Log in to continue your practice.'}</p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {register && (
            <label className="block text-sm font-medium">Full name
              <input className="input mt-1.5 font-normal" autoComplete="name" value={form.name} onChange={set('name')} required minLength={2} maxLength={60} autoFocus />
            </label>
          )}
          <label className="block text-sm font-medium">Email
            <input className="input mt-1.5 font-normal" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} required maxLength={120} autoFocus={!register} />
          </label>
          {register && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">Phone number</label>
              <div className="mt-1.5 flex gap-2">
                <select className="input w-[9.5rem] shrink-0 px-2" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country code">
                  {COUNTRIES.map(([c, d, n]) => <option key={c} value={c}>{c} {d} {n.length > 12 ? '' : n}</option>)}
                </select>
                <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="300 1234567" value={form.phone} onChange={set('phone')} required maxLength={16} />
              </div>
              <p className="mt-1.5 text-xs text-muted">Saved as {dial}{form.phone.replace(/\D/g, '').replace(/^0+/, '') || '...'}. Used for account security and support, never shared.</p>
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <div className="relative mt-1.5">
              <input id="password" className="input pr-10" type={show ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} required maxLength={72} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {register && form.password && (
              <div className="mt-3" aria-live="polite">
                <div className="flex gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded ${pw.score >= i ? BAR[pw.score] : 'bg-line'}`} />)}</div>
                <p className="mt-1.5 text-xs text-muted">{LABEL[pw.score]}</p>
                <ul className="mt-1.5 space-y-1 text-xs">
                  {pw.rules.map((r) => <li key={r.label} className={`flex items-center gap-1.5 ${r.ok ? 'text-good' : 'text-muted'}`}>{r.ok ? <Check size={12} /> : <Circle size={12} />}{r.label}</li>)}
                </ul>
              </div>
            )}
          </div>
          {register && (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
              <span>I agree to the <Link href="/terms" target="_blank" className="link">Terms</Link> and <Link href="/privacy" target="_blank" className="link">Privacy policy</Link>.</span>
            </label>
          )}
          {error && <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
          <button className="btn-primary flex w-full items-center justify-center gap-2 py-2.5" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}{register ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {register ? 'Already have an account?' : 'New here?'}{' '}
          <button className="link" onClick={() => onModeChange(register ? 'login' : 'register')}>{register ? 'Log in' : 'Create an account'}</button>
        </p>
        {!register && <p className="mt-2 text-center text-xs text-muted">Forgot your password? <Link href="/contact?topic=support" className="link" onClick={onClose}>Contact support</Link></p>}
      </div>
    </div>
  );
}

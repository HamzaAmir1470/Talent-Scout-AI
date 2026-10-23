'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

export type Tone = 'good' | 'warn' | 'bad' | 'brand' | 'muted';
const TONE: Record<Tone, string> = {
  good: 'border-good/30 bg-good/10 text-good', warn: 'border-warn/30 bg-warn/10 text-warn', bad: 'border-bad/30 bg-bad/10 text-bad',
  brand: 'border-brand/30 bg-brand/10 text-brand', muted: 'border-line bg-subtle text-muted',
};

export const Badge = ({ tone = 'muted', children }: { tone?: Tone; children: React.ReactNode }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>{children}</span>
);

export function StatCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-muted"><span className="text-sm">{label}</span>{icon}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="img" aria-label={label}>
      <div className="flex h-32 items-end gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="group relative flex flex-1 flex-col justify-end" title={`${d.label}: ${d.value}`}>
            <div className="rounded-t bg-brand/80 transition group-hover:bg-brand" style={{ height: `${Math.max(d.value ? 6 : 2, (d.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted"><span>{data[0]?.label.slice(5)}</span><span>{data[data.length - 1]?.label.slice(5)}</span></div>
    </div>
  );
}

export function Pager({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>{total === 0 ? 'No results' : `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}`}</span>
      <div className="flex items-center gap-2">
        <button className="btn-ghost px-2.5 py-1.5" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <span>Page {page} of {pages}</span>
        <button className="btn-ghost px-2.5 py-1.5" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`card my-8 w-full p-6 shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-lg'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-subtle"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

/** Confirmation dialog. Set requirePhrase to make the admin type something (for example an email) before a destructive action. */
export function Confirm({ title, body, confirmLabel, danger, requirePhrase, onConfirm, onClose }: {
  title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; requirePhrase?: string; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const blocked = Boolean(requirePhrase) && typed.trim().toLowerCase() !== requirePhrase!.toLowerCase();
  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm text-muted">{body}</div>
      {requirePhrase && (
        <label className="mt-4 block text-sm font-medium">Type <b className="font-mono">{requirePhrase}</b> to confirm
          <input className="input mt-1.5 font-normal" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
        </label>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button disabled={blocked || busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-brand disabled:opacity-50 ${danger ? 'bg-bad' : 'bg-brand'}`}>
          {busy && <Loader2 size={14} className="animate-spin" />}{confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-');

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

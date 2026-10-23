'use client';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast } from '@/store/toast';

const STYLE = {
  success: { icon: CheckCircle2, cls: 'text-good' },
  error: { icon: AlertCircle, cls: 'text-bad' },
  info: { icon: Info, cls: 'text-brand' },
};

export default function Toaster() {
  const { items, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-2" role="status" aria-live="polite">
      {items.map((t) => {
        const { icon: Icon, cls } = STYLE[t.kind];
        return (
          <div key={t.id} className="card rise pointer-events-auto flex items-start gap-3 p-3 text-sm shadow-lg">
            <Icon size={18} className={`mt-0.5 shrink-0 ${cls}`} />
            <p className="flex-1">{t.text}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}

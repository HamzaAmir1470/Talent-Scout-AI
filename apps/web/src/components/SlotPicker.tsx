'use client';
import { useMemo, useState } from 'react';

const DAY = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const DATE = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const TIME = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export default function SlotPicker({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d;
  }), []);
  const [day, setDay] = useState(days[0]);
  const min = Date.now() + 6 * 60_000;

  const slots = useMemo(() => {
    const out: Date[] = [];
    for (let h = 7; h < 23; h++) for (const m of [0, 30]) { const d = new Date(day); d.setHours(h, m, 0, 0); out.push(d); }
    return out;
  }, [day]);

  return (
    <div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {days.map((d) => {
          const on = d.getTime() === day.getTime();
          return (
            <button key={d.toISOString()} type="button" onClick={() => setDay(d)}
              className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 text-xs transition ${on ? 'border-transparent bg-white text-slate-900' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              <span className="font-medium opacity-70">{DAY.format(d)}</span>
              <b className="text-sm">{DATE.format(d)}</b>
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
        {slots.map((s) => {
          const disabled = s.getTime() < min;
          const on = value?.getTime() === s.getTime();
          return (
            <button key={s.toISOString()} type="button" disabled={disabled} onClick={() => onChange(s)}
              className={`rounded-lg border px-2 py-1.5 text-sm transition ${on ? 'border-transparent bg-brand text-on-brand' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'} disabled:cursor-not-allowed disabled:opacity-30`}>
              {TIME.format(s)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

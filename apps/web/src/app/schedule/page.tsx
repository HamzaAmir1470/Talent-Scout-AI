'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, CalendarPlus, Clock, DoorOpen, FileText, Globe, Loader2, Pencil, X, Zap } from 'lucide-react';
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';
import SlotPicker from '@/components/SlotPicker';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { api, errorMessage } from '@/lib/api';
import { SubjectIcon } from '@/lib/icons';
import { useApi } from '@/lib/useApi';
import { toast } from '@/store/toast';
import type { Booking, BookingStatus, Paged, Persona, Subject } from '@/lib/types';

const FULL = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const LEVELS = ['Junior', 'Mid-level', 'Senior'];
const DURATIONS = [15, 20, 30, 45];
const TZ = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';

const STATUS: Record<BookingStatus, string> = {
  scheduled: 'border-brand/40 bg-brand/10 text-brand', in_progress: 'border-good/40 bg-good/10 text-good',
  completed: 'border-good/40 bg-good/10 text-good', cancelled: 'border-line bg-subtle text-muted', missed: 'border-bad/40 bg-bad/10 text-bad',
};

function relative(iso: string) {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (diff <= 0) return 'now';
  if (diff < 60) return `in ${diff} min`;
  if (diff < 1440) return `in ${Math.round(diff / 60)} h`;
  return `in ${Math.round(diff / 1440)} d`;
}

const Step = ({ n, title }: { n: number; title: string }) => (
  <h3 className="mb-3 flex items-center gap-2.5 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-canvas">{n}</span>{title}</h3>
);

function BookingCard({ b, subject, onChanged }: { b: Booking; subject?: Subject; onChanged: () => void }) {
  const [moving, setMoving] = useState(false);
  const [slot, setSlot] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const accent = subject?.accent ?? '#0e7c66';

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast.success(ok); setMoving(false); onChanged(); }
    catch (e) { toast.error(errorMessage(e)); }
    finally { setBusy(false); }
  }
  async function ics() {
    try {
      const { data } = await api.get(`/bookings/${b.id}/ics`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = `interview-${b.id}.ics`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(errorMessage(e)); }
  }

  const upcoming = b.status === 'scheduled';
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}><SubjectIcon name={subject?.icon ?? 'Layers'} size={20} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-base font-semibold">{b.subjectName}</h3>
            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${STATUS[b.status]}`}>{b.status.replace('_', ' ')}</span>
          </div>
          <p className="text-sm text-muted">{b.candidateRole} · {b.level} · {b.durationMin} min</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm"><CalendarDays size={14} className="text-muted" /> {FULL.format(new Date(b.scheduledAt))}{upcoming && <span className="text-xs text-muted">({relative(b.scheduledAt)})</span>}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {b.joinable && <Link href={`/interview/${b.id}`} className="btn-primary gap-2"><DoorOpen size={15} /> Join room</Link>}
        {b.status === 'completed' && b.sessionId && <Link href={`/reports/${b.sessionId}`} className="btn-primary gap-2"><FileText size={15} /> View report</Link>}
        {upcoming && !b.joinable && <Link href={`/interview/${b.id}`} className="btn-ghost gap-2"><DoorOpen size={15} /> Open lobby</Link>}
        {upcoming && <button onClick={() => setMoving((m) => !m)} aria-expanded={moving} className="btn-ghost gap-2"><Pencil size={14} /> Reschedule</button>}
        {upcoming && <button onClick={ics} className="btn-ghost gap-2"><CalendarPlus size={14} /> Calendar</button>}
        {upcoming && <button disabled={busy} onClick={() => confirm('Cancel this interview?') && run(() => api.patch(`/bookings/${b.id}/cancel`), 'Interview cancelled')} className="btn-ghost gap-2 text-bad"><X size={14} /> Cancel</button>}
      </div>
      {moving && (
        <div className="mt-5 border-t border-line pt-5">
          <SlotPicker value={slot} onChange={setSlot} />
          <button disabled={!slot || busy} className="btn-primary mt-4 gap-2" onClick={() => run(() => api.patch(`/bookings/${b.id}/reschedule`, { scheduledAt: slot!.toISOString() }), 'Interview rescheduled')}>
            {busy && <Loader2 size={15} className="animate-spin" />} Confirm new time
          </button>
        </div>
      )}
    </div>
  );
}

function Planner({ subjects, personas, onBooked }: { subjects: Subject[]; personas: Persona[]; onBooked: () => void }) {
  const router = useRouter();
  const [subject, setSubject] = useState(subjects[0]?.slug ?? '');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('Mid-level');
  const [duration, setDuration] = useState(20);
  const [slot, setSlot] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const persona = personas.find((p) => p.subject === subject);
  useEffect(() => { if (persona) setRole(persona.defaultRole); }, [persona]);

  async function book(instant: boolean) {
    if (!instant && !slot) { toast.info('Pick a day and time first'); return; }
    setBusy(true);
    try {
      const { data } = await api.post<Booking>('/bookings', {
        subject, candidateRole: role.trim() || persona?.defaultRole || 'Software Engineer', level, durationMin: duration,
        ...(instant ? { instant: true } : { scheduledAt: slot!.toISOString() }),
      });
      if (instant) { router.push(`/interview/${data.id}`); return; }
      toast.success(`Booked for ${FULL.format(slot!)}`);
      setSlot(null); onBooked();
    } catch (e) { toast.error(errorMessage(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-2xl font-semibold">Book a mock interview</h2>
      <p className="mt-1 text-sm text-muted">Pick a topic and your interviewer adapts the questions to it.</p>

      <div className="mt-6"><Step n={1} title="Choose a technology" />
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button key={s.slug} onClick={() => setSubject(s.slug)} aria-pressed={subject === s.slug} className={`chip px-3 py-1.5 text-sm ${subject === s.slug ? 'chip-active' : 'hover:bg-subtle'}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: s.accent }} />{s.name}
            </button>
          ))}
        </div>
        {persona && <p className="mt-3 rounded-lg bg-subtle p-3 text-sm text-muted">You will meet <b className="text-ink">{persona.interviewer}</b>, {persona.title}. Likely topics: {persona.focus.slice(0, 3).join(', ')}.</p>}
      </div>

      <div className="mt-7"><Step n={2} title="Tell us about the role" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">Target role
            <input className="input mt-1.5 font-normal" value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} placeholder="e.g. DevOps Engineer" />
          </label>
          <div><span className="mb-1.5 block text-sm font-medium">Level</span><div className="flex gap-1.5">{LEVELS.map((l) => <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l} className={`chip flex-1 justify-center py-2 ${level === l ? 'chip-active' : 'hover:bg-subtle'}`}>{l}</button>)}</div></div>
          <div><span className="mb-1.5 block text-sm font-medium">Length</span><div className="flex gap-1.5">{DURATIONS.map((d) => <button key={d} onClick={() => setDuration(d)} aria-pressed={duration === d} className={`chip flex-1 justify-center py-2 ${duration === d ? 'chip-active' : 'hover:bg-subtle'}`}>{d} min</button>)}</div></div>
        </div>
      </div>

      <div className="mt-7"><Step n={3} title="Pick a time" />
        <SlotPicker value={slot} onChange={setSlot} />
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Globe size={12} /> Times are shown in your timezone{TZ ? ` (${TZ})` : ''}.</p>
      </div>

      <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-6">
        <button disabled={busy || !slot} className="btn-primary gap-2 px-5 py-2.5" onClick={() => book(false)}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <CalendarPlus size={15} />}{slot ? `Book ${FULL.format(slot)}` : 'Pick a time to book'}
        </button>
        <button disabled={busy} className="btn-ghost gap-2 px-5 py-2.5" onClick={() => book(true)}><Zap size={15} /> Start now instead</button>
      </div>
    </div>
  );
}

function Content() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const subjects = useApi<Subject[]>('/content/subjects');
  const personas = useApi<Persona[]>('/interviews/personas');
  const bookings = useApi<Paged<Booking>>(`/bookings?view=${tab}&limit=30`);
  const bySlug = useMemo(() => new Map((subjects.data ?? []).map((s) => [s.slug, s])), [subjects.data]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-10 sm:px-6">
      <p className="eyebrow">AI mock interviews</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Rehearse the <span className="text-gradient">real thing</span></h1>
      <p className="mt-3 max-w-xl text-muted">Book a time or start right now. The room opens 10 minutes before your slot.</p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div>
          {subjects.data && personas.data
            ? <Planner subjects={subjects.data} personas={personas.data} onBooked={() => { setTab('upcoming'); bookings.reload(); }} />
            : subjects.error || personas.error ? <ErrorBox message={subjects.error || personas.error} /> : <Skeleton className="h-[34rem]" />}
        </div>
        <div>
          <div className="mb-4 inline-flex rounded-lg border border-line bg-surface p-1" role="tablist">
            {(['upcoming', 'past'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${tab === t ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`}>{t}</button>
            ))}
          </div>
          <div className="space-y-4">
            {bookings.loading && <Skeleton className="h-36" />}
            {bookings.error && <ErrorBox message={bookings.error} />}
            {bookings.data?.items.map((b) => <BookingCard key={b.id} b={b} subject={bySlug.get(b.subject)} onChanged={bookings.reload} />)}
            {bookings.data && bookings.data.items.length === 0 && (
              <div className="card p-8 text-center text-muted"><Clock className="mx-auto mb-2" size={22} />{tab === 'upcoming' ? 'Nothing booked yet. Pick a time on the left or start right now.' : 'Completed and past interviews will appear here.'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (<><Header /><main><RequireAuth reason="book an interview"><Content /></RequireAuth></main></>);
}

'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock, Loader2, Mic, MicOff, PhoneOff, Repeat, Send, Volume2, VolumeX, Wifi, WifiOff, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';
import ReportView from '@/components/ReportView';
import Waveform from '@/components/Waveform';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';
import { useInterviewRoom } from '@/lib/useInterviewRoom';
import type { Booking } from '@/lib/types';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const STATE = { idle: 'Your turn when you are ready', listening: 'Listening to you', speaking: 'Interviewer is speaking', thinking: 'Interviewer is thinking' } as const;
const WHEN = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

function Ctl({ label, onClick, active, danger, disabled, children }: { label: string; onClick: () => void; active?: boolean; danger?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active}
      className="group flex w-16 flex-col items-center gap-1.5 text-xs font-medium text-muted disabled:opacity-40 sm:w-20">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full border transition sm:h-14 sm:w-14 ${danger ? 'border-bad/40 bg-bad/10 text-bad group-hover:bg-bad/20' : active ? 'border-bad bg-bad text-on-brand' : 'border-line bg-surface text-ink group-hover:bg-subtle'}`}>{children}</span>
      {label}
    </button>
  );
}

function Room({ id }: { id: string }) {
  const booking = useApi<Booking>(`/bookings/${id}`);
  const room = useInterviewRoom(id);
  const [text, setText] = useState('');
  const [micTested, setMicTested] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [room.messages, room.aiDraft, room.interim]);

  const b = booking.data;
  const opensIn = b ? Math.max(0, Math.round((new Date(b.joinOpensAt).getTime() - now) / 1000)) : 0;
  const closed = b ? now > new Date(b.joinClosesAt).getTime() : false;
  const canStart = Boolean(b) && !closed && opensIn === 0 && ['scheduled', 'in_progress'].includes(b!.status);
  const send = (e: FormEvent) => { e.preventDefault(); room.submit(text); setText(''); };

  if (booking.loading) return <div className="mx-auto max-w-4xl space-y-4 px-4 py-10"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-72" /></div>;
  if (booking.error || !b) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorBox message={booking.error || 'Booking not found'} /></div>;

  if (room.phase === 'report' && room.report) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <p className="eyebrow">Interview complete</p>
        <h1 className="mt-2 text-4xl font-semibold">Your <span className="text-gradient">performance report</span></h1>
        <div className="mt-8"><ReportView report={room.report} subject={b.subject} subjectName={b.subjectName} role={b.candidateRole} /></div>
        {room.sessionId && <p className="mt-6 text-center text-sm text-muted">Saved to <Link className="link" href={`/reports/${room.sessionId}`}>Reports</Link> with the full transcript.</p>}
      </div>
    );
  }

  if (room.phase === 'ending') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center" role="status">
        <div className="card p-10">
          <div className="mx-auto h-20 w-full max-w-xs"><Waveform analyser={null} mode="thinking" /></div>
          <h2 className="mt-6 text-xl font-semibold">Analysing your answers</h2>
          <p className="mt-2 text-sm text-muted">Scoring accuracy, depth and communication. This usually takes about 15 seconds.</p>
        </div>
      </div>
    );
  }

  if (room.phase === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="card p-8" role="alert">
          <AlertTriangle className="mx-auto text-warn" size={32} />
          <p className="mt-4">{room.error}</p>
          <div className="mt-6 flex justify-center gap-3"><button className="btn-primary" onClick={room.retry}>Try again</button><Link className="btn-ghost" href="/schedule">Back to interviews</Link></div>
        </div>
      </div>
    );
  }

  // ---------------- lobby ----------------
  if (room.phase === 'lobby' || room.phase === 'connecting') {
    const checks = [
      { ok: room.srSupported, label: room.srSupported ? 'Hands-free speech recognition is supported' : 'This browser has no live speech recognition. Chrome or Edge give the best experience, or you can type.' },
      { ok: micTested, label: micTested ? 'Microphone is working' : 'Test your microphone (optional)' },
      { ok: true, label: 'Headphones recommended, so the interviewer is not picked up by your mic' },
    ];
    return (
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
        <p className="eyebrow">Interview lobby</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">{b.subjectName} <span className="text-gradient">interview</span></h1>
        <div className="mt-8 grid items-start gap-6 md:grid-cols-[1fr_1.1fr]">
          <section className="card p-6">
            <h2 className="font-sans text-sm font-semibold">Session details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[['Role', b.candidateRole], ['Level', b.level], ['Length', `${b.durationMin} minutes`], ['Scheduled', WHEN.format(new Date(b.scheduledAt))]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
            <h2 className="mt-7 font-sans text-sm font-semibold">What to expect</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>The interviewer asks one question at a time and listens.</li>
              <li>Pause when you finish and it will reply. You can ask it to repeat.</li>
              <li>You get a scored report when you end the session.</li>
            </ul>
          </section>
          <section className="card p-6">
            <div className="h-24 rounded-lg bg-subtle"><Waveform analyser={room.analyser} mode={micTested ? 'listening' : 'idle'} /></div>
            <ul className="mt-5 space-y-3 text-sm">
              {checks.map((c) => <li key={c.label} className="flex items-start gap-2.5">{c.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-good" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-warn" />}<span className="text-ink2">{c.label}</span></li>)}
            </ul>
            {room.notice && <p className="mt-3 text-sm text-warn" role="alert">{room.notice}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn-ghost gap-2" onClick={async () => setMicTested(await room.prepareMic())}><Mic size={15} /> Test microphone</button>
              <button className="btn-primary gap-2 px-6" disabled={!canStart || room.phase === 'connecting'} onClick={room.start}>
                {room.phase === 'connecting' ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />} Start interview
              </button>
            </div>
            {!canStart && (
              <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-subtle p-3 text-sm text-muted">
                <Clock size={15} />
                {closed ? 'This interview window has closed. Book a new slot.' : b.status === 'cancelled' ? 'This interview was cancelled.' : b.status === 'completed' ? 'This interview is complete.' : `The room opens in ${mmss(opensIn)}, 10 minutes before the start time.`}
                {b.status === 'completed' && b.sessionId && <Link className="link" href={`/reports/${b.sessionId}`}>View report</Link>}
              </p>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ---------------- live ----------------
  const low = (room.secondsLeft ?? 999) <= 60;
  return (
    <div className="mx-auto flex max-w-[1300px] flex-col gap-4 px-4 py-4 sm:px-6 lg:h-[calc(100dvh-4rem)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-semibold text-on-brand">{room.persona?.name?.[0] ?? 'I'}</span>
        <div className="min-w-0"><div className="font-semibold leading-tight">{room.persona?.name}{room.demo && <span className="ml-2 rounded border border-warn/40 px-1.5 py-0.5 align-middle text-[10px] font-medium uppercase text-warn">Demo</span>}</div><div className="text-xs text-muted">{room.persona?.title}</div></div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`chip ${room.connected ? 'text-good' : 'text-bad'}`}>{room.connected ? <Wifi size={12} /> : <WifiOff size={12} />}{room.connected ? 'Connected' : 'Reconnecting'}</span>
          <span className={`chip font-mono text-sm ${low ? 'border-bad/50 text-bad' : ''}`} aria-label="Time left"><Clock size={13} />{room.secondsLeft === null ? '--:--' : mmss(room.secondsLeft)}</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="card flex flex-col p-5">
          <div className="relative min-h-[200px] flex-1 rounded-lg bg-subtle/70 sm:min-h-[260px]"><Waveform analyser={room.analyser} mode={room.orb} /></div>
          <p className="mt-4 text-center text-sm font-medium" aria-live="polite">{room.recording ? 'Recording. Tap the mic to send.' : STATE[room.orb]}</p>
          {room.notice && <p className="mt-2 text-center text-sm text-warn" role="alert">{room.notice}</p>}
          <div className="mt-5 flex flex-wrap items-start justify-center gap-2 sm:gap-4">
            {room.mode === 'server'
              ? <Ctl label={room.recording ? 'Send' : 'Record'} onClick={room.toggleRecord} active={room.recording}><Mic size={20} /></Ctl>
              : <Ctl label={room.muted || room.mode === 'text' ? 'Unmute' : 'Mute'} onClick={room.toggleMute} active={room.muted} disabled={room.mode === 'text'}>{room.muted || room.mode === 'text' ? <MicOff size={20} /> : <Mic size={20} />}</Ctl>}
            <Ctl label={room.voiceOn ? 'Voice on' : 'Voice off'} onClick={() => room.setVoiceOn(!room.voiceOn)}>{room.voiceOn ? <Volume2 size={20} /> : <VolumeX size={20} />}</Ctl>
            <Ctl label="Repeat" onClick={room.repeatQuestion}><Repeat size={20} /></Ctl>
            <Ctl label="End" onClick={() => setConfirmEnd(true)} danger><PhoneOff size={20} /></Ctl>
          </div>
          {confirmEnd && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm" role="alertdialog" aria-label="Confirm end interview">
              <span>End the interview and get your report?</span>
              <button className="rounded-lg bg-bad px-4 py-1.5 font-semibold text-on-brand" onClick={room.endSession}>End and score</button>
              <button className="btn-ghost py-1.5" onClick={() => setConfirmEnd(false)}>Keep going</button>
            </div>
          )}
          <p className="mt-4 text-center text-xs text-muted">
            {room.mode === 'browser' && 'Hands-free. Answer out loud and pause when you are done.'}
            {room.mode === 'server' && 'Tap the mic to record your answer, then tap again to send it.'}
            {room.mode === 'text' && 'Voice input is unavailable here. Type your answers on the right.'}
          </p>
        </section>

        <section className="card flex h-[60vh] min-h-0 flex-col lg:h-auto">
          <div className="border-b border-line px-5 py-3 text-sm font-semibold">Live transcript</div>
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
            {room.messages.length === 0 && !room.aiDraft && <p className="text-sm text-muted">The interviewer is about to begin...</p>}
            {room.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : ''}`}>
                <div className={`max-w-[88%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'candidate' ? 'rounded-br-sm bg-brand text-on-brand' : 'rounded-bl-sm bg-subtle'}`}>{m.text}</div>
              </div>
            ))}
            {room.aiDraft && <div className="flex"><div className="max-w-[88%] rounded-xl rounded-bl-sm bg-subtle px-4 py-2.5 text-sm leading-relaxed">{room.aiDraft}<span className="ml-0.5 animate-pulse">▍</span></div></div>}
            {room.interim && <div className="flex justify-end"><div className="max-w-[88%] rounded-xl rounded-br-sm border border-dashed border-brand/50 px-4 py-2.5 text-sm italic text-muted">{room.interim}</div></div>}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type your answer" aria-label="Type your answer" maxLength={4000} />
            <button className="btn-primary px-4" aria-label="Send answer" disabled={!text.trim()}><Send size={16} /></button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  return (<><Header /><main><RequireAuth reason="join your interview"><Room id={bookingId} /></RequireAuth></main></>);
}

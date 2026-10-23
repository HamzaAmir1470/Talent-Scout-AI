'use client';
import Link from 'next/link';
import { Award, BookOpen, CalendarClock, DoorOpen, Mic, Target } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { usePractice } from '@/store/practice';
import { useApi } from '@/lib/useApi';
import type { Booking, Paged, Stats } from '@/lib/types';
import { TOPICS } from './Hero';

const WHEN = new Intl.DateTimeFormat(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' });

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const { bookmarks, progress } = usePractice();
  const known = Object.values(progress).filter((v) => v === 'known').length;
  const upcoming = useApi<Paged<Booking>>('/bookings?view=upcoming&limit=1');
  const stats = useApi<Stats>('/interviews/stats');
  const next = upcoming.data?.items[0];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="eyebrow">Dashboard</p>
      <h2 className="mt-2 text-3xl font-bold">Hello, <span className="text-gradient">{user?.name}</span></h2>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass p-6">
          <div className="eyebrow flex items-center gap-2"><CalendarClock size={14} /> Next interview</div>
          {next ? (
            <>
              <h3 className="mt-3 text-2xl font-semibold">{next.subjectName}</h3>
              <p className="text-slate-400">{next.candidateRole} · {WHEN.format(new Date(next.scheduledAt))} · {next.durationMin} min</p>
              <div className="mt-5 flex gap-3">
                <Link href={`/interview/${next.id}`} className={next.joinable ? 'btn-primary flex items-center gap-2' : 'btn-ghost flex items-center gap-2'}><DoorOpen size={15} /> {next.joinable ? 'Join room' : 'Open lobby'}</Link>
                <Link href="/schedule" className="btn-ghost">Manage</Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-3 text-2xl font-semibold">Nothing booked yet</h3>
              <p className="text-slate-400">Practice out loud with an AI interviewer tuned to your stack.</p>
              <Link href="/schedule" className="btn-primary mt-5 inline-flex items-center gap-2"><Mic size={15} /> Book an interview</Link>
            </>
          )}
        </div>
        <Link href="/reports" className="glass spot p-6">
          <div className="eyebrow relative flex items-center gap-2"><Award size={14} /> Interview score</div>
          <b className="relative mt-3 block text-5xl">{stats.data?.sessions ? stats.data.avgOverall : '--'}</b>
          <p className="relative mt-1 text-sm text-slate-400">{stats.data?.sessions ? `average across ${stats.data.sessions} interview${stats.data.sessions > 1 ? 's' : ''}` : 'Complete an interview to see your score'}</p>
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/practice" className="glass spot p-5"><Target className="relative text-indigo-300" size={22} /><h3 className="relative mt-3 font-medium">Question bank</h3><p className="relative text-sm text-slate-400">{known} nailed, {Object.keys(bookmarks).length} bookmarked</p></Link>
        <Link href="/learn" className="glass spot p-5"><BookOpen className="relative text-fuchsia-300" size={22} /><h3 className="relative mt-3 font-medium">Learning library</h3><p className="relative text-sm text-slate-400">Guides for every subject</p></Link>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">{TOPICS.map((t) => <span key={t} className="chip">{t}</span>)}</div>
    </section>
  );
}

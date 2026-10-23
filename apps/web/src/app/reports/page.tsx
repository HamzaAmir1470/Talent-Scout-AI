'use client';
import Link from 'next/link';
import { ArrowRight, Award, BarChart3, Mic, Trophy } from 'lucide-react';
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';
import { scoreColor } from '@/components/ReportView';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';
import type { Paged, SessionSummary, Stats } from '@/lib/types';

const DATE = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

function Trend({ points }: { points: Stats['trend'] }) {
  if (points.length < 2) return <p className="text-sm text-slate-500">Complete two interviews to see your trend.</p>;
  const W = 320, H = 90, P = 8;
  const x = (i: number) => P + (i * (W - P * 2)) / (points.length - 1);
  const y = (v: number) => H - P - (v / 100) * (H - P * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.overall)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Score trend">
      <path d={`${d} L${x(points.length - 1)},${H} L${x(0)},${H} Z`} fill="rgb(var(--brand) / .12)" />
      <path d={d} fill="none" stroke="rgb(var(--brand))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={p.id} cx={x(i)} cy={y(p.overall)} r="3.5" fill="rgb(var(--surface))" stroke="rgb(var(--brand))" strokeWidth="2" />)}
    </svg>
  );
}

function Content() {
  const stats = useApi<Stats>('/interviews/stats');
  const list = useApi<Paged<SessionSummary>>('/interviews?limit=30');
  const s = stats.data;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <p className="eyebrow">Progress</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Your <span className="text-gradient">reports</span></h1>

      {stats.error && <div className="mt-6"><ErrorBox message={stats.error} /></div>}
      {s && s.sessions > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="glass p-5">
            <div className="flex items-center justify-between"><span className="eyebrow">Overall score trend</span><span className="text-xs text-slate-500">last {s.trend.length}</span></div>
            <div className="mt-3"><Trend points={s.trend} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4"><BarChart3 size={18} className="text-indigo-300" /><b className="mt-2 block text-3xl">{s.sessions}</b><span className="text-xs text-slate-400">interviews</span></div>
            <div className="glass p-4"><Award size={18} className="text-fuchsia-300" /><b className={`mt-2 block text-3xl ${scoreColor(s.avgOverall)}`}>{s.avgOverall}</b><span className="text-xs text-slate-400">average score</span></div>
            <div className="glass col-span-2 p-4"><Trophy size={18} className="text-amber-300" /><b className="mt-2 block">{s.bestSubject?.name ?? '-'}</b><span className="text-xs text-slate-400">best subject{s.bestSubject ? ` (${s.bestSubject.avg})` : ''}</span></div>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-3">
        {list.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        {list.error && <ErrorBox message={list.error} />}
        {list.data?.items.map((r, i) => (
          <Link key={r.id} href={`/reports/${r.id}`} className="glass spot group rise flex items-center gap-5 p-5" style={{ animationDelay: `${i * 40}ms` }}>
            <div className={`relative w-16 text-center text-3xl font-bold ${scoreColor(r.overall)}`}>{r.overall}<span className="block text-[10px] font-medium uppercase tracking-widest text-slate-500">score</span></div>
            <div className="relative min-w-0 flex-1">
              <h3 className="font-semibold">{r.subjectName} <span className="font-normal text-slate-400">· {r.candidateRole}</span></h3>
              <p className="text-sm text-slate-400">{DATE.format(new Date(r.endedAt))} · {Math.max(1, Math.round(r.durationSec / 60))} min</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>Accuracy <b className={scoreColor(r.technicalAccuracy)}>{r.technicalAccuracy}</b></span>
                <span>Depth <b className={scoreColor(r.depth)}>{r.depth}</b></span>
                <span>Communication <b className={scoreColor(r.communication)}>{r.communication}</b></span>
              </div>
            </div>
            <ArrowRight className="relative text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        ))}
        {list.data && list.data.items.length === 0 && (
          <div className="glass p-10 text-center">
            <Mic className="mx-auto text-indigo-300" size={28} />
            <h3 className="mt-3 font-semibold">No reports yet</h3>
            <p className="mt-1 text-sm text-slate-400">Finish a mock interview and your scored report shows up here.</p>
            <Link href="/schedule" className="btn-primary mt-5 inline-block">Book your first interview</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (<><Header /><main><RequireAuth reason="see your reports"><Content /></RequireAuth></main></>);
}

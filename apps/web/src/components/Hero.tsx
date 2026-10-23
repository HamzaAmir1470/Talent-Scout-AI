'use client';
import Link from 'next/link';
import { ArrowRight, BookOpen, ShieldCheck, Timer } from 'lucide-react';
import { useUi } from '@/store/ui';

export const TOPICS = [
  'MERN', 'React Native', 'Python', 'Flask', 'Docker',
  'DevOps', 'Software Engineering', 'AI', 'Automata', 'DSA',
];

const BARS = [30, 55, 40, 78, 50, 92, 60, 35, 72, 46, 86, 55, 30, 66, 40, 26, 58, 34];

function Preview() {
  return (
    <div className="relative pb-10">
      <div className="card overflow-hidden shadow-[0_30px_60px_-30px_rgb(var(--ink)/.35)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">L</span>
            <div><div className="text-sm font-semibold">Leo</div><div className="text-xs text-muted">DevOps Engineer · Docker</div></div>
          </div>
          <span className="chip"><Timer size={12} /> 12:40 left</span>
        </div>
        <div className="flex h-24 items-center justify-center gap-1 bg-subtle/70 px-6" aria-hidden>
          {BARS.map((h, i) => (
            <span key={i} className="bar w-1.5 rounded-full bg-brand"
              style={{ height: `${h}%`, transformOrigin: 'center', animation: `bars ${1.1 + (i % 5) * 0.17}s ease-in-out ${i * 0.06}s infinite` }} />
          ))}
        </div>
        <div className="space-y-3 p-4 text-sm leading-relaxed">
          <div className="max-w-[88%] rounded-lg rounded-bl-sm bg-subtle px-3 py-2">Why would you use a multi-stage build for a Node service?</div>
          <div className="ml-auto max-w-[88%] rounded-lg rounded-br-sm bg-brand px-3 py-2 text-on-brand">So the final image ships only the compiled output and production dependencies. It stays small and has less to attack.</div>
          <div className="max-w-[88%] rounded-lg rounded-bl-sm bg-subtle px-3 py-2">Good. How would you make sure the dependency layer is cached?</div>
        </div>
      </div>
      <div className="card absolute -bottom-2 left-0 w-60 p-4 shadow-xl sm:-left-8">
        <div className="eyebrow">Last interview</div>
        <div className="mt-1 flex items-end gap-2"><span className="font-display text-4xl font-semibold leading-none">78</span><span className="pb-1 text-xs text-good">Hire</span></div>
        {[['Accuracy', 84], ['Depth', 70], ['Communication', 80]].map(([l, v]) => (
          <div key={l as string} className="mt-2.5">
            <div className="flex justify-between text-[11px] text-muted"><span>{l}</span><span>{v}</span></div>
            <div className="mt-1 h-1.5 rounded bg-subtle"><div className="h-full rounded bg-brand" style={{ width: `${v}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const openAuth = useUi((s) => s.openAuth);
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
      <div>
        <p className="eyebrow rise">Interview practice for developers</p>
        <h1 className="rise mt-4 text-[2.6rem] font-semibold leading-[1.08] sm:text-6xl" style={{ animationDelay: '60ms' }}>
          Practice the interview <span className="mark">before it counts.</span>
        </h1>
        <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ animationDelay: '120ms' }}>
          Talent Scout AI runs spoken mock interviews tuned to your stack, scores every answer and tells you exactly what to study next. No scheduling with friends. No guessing how you did.
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
          <button className="btn-primary px-5 py-3 text-base" onClick={() => openAuth('register')}>Start a mock interview <ArrowRight size={16} className="ml-2" /></button>
          <Link href="/learn" className="btn-ghost px-5 py-3 text-base"><BookOpen size={16} className="mr-2" /> Read the docs</Link>
        </div>
        <ul className="rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" style={{ animationDelay: '240ms' }}>
          <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Free to start</li>
          <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Audio is never stored</li>
          <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-brand" /> Report in about 15 seconds</li>
        </ul>
      </div>
      <div className="rise" style={{ animationDelay: '200ms' }}><Preview /></div>
    </section>
  );
}

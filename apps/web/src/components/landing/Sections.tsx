'use client';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarCheck, LineChart, ListChecks, Mic, Target, UserCheck } from 'lucide-react';
import { SubjectIcon } from '@/lib/icons';
import { useApi } from '@/lib/useApi';
import { useUi } from '@/store/ui';
import type { Subject } from '@/lib/types';

const Head = ({ eyebrow, title, lead }: { eyebrow: string; title: React.ReactNode; lead?: string }) => (
  <div className="max-w-2xl">
    <p className="eyebrow">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
    {lead && <p className="mt-4 text-lg leading-relaxed text-muted">{lead}</p>}
  </div>
);
const Wrap = ({ children, tint = false, id }: { children: React.ReactNode; tint?: boolean; id?: string }) => (
  <section id={id} className={tint ? 'border-y border-line bg-subtle/50' : ''}>
    <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">{children}</div>
  </section>
);

export function Stats() {
  const { data } = useApi<Subject[]>('/content/subjects');
  const items = [
    ['Technologies', data?.length ?? 10],
    ['Documentation pages', data?.reduce((n, s) => n + s.topicCount, 0) ?? 44],
    ['Interview questions', data?.reduce((n, s) => n + s.questionCount, 0) ?? 131],
    ['AI interviewers', 10],
  ];
  return (
    <section className="border-y border-line bg-subtle/50">
      <dl className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
        {items.map(([label, n]) => (
          <div key={label as string}><dd className="font-display text-4xl font-semibold">{n}</dd><dt className="mt-1 text-sm text-muted">{label}</dt></div>
        ))}
      </dl>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: CalendarCheck, title: 'Pick a topic and a time', text: 'Choose a technology, your target role and level, then book a slot or start right now. Add it to your calendar in one click.' },
    { icon: Mic, title: 'Talk it through', text: 'Join the room and answer out loud. Your interviewer listens, asks follow-ups and keeps time, just like a real call.' },
    { icon: ListChecks, title: 'Read your report', text: 'Get scores for accuracy, depth and communication, feedback on every question and a short study plan for next time.' },
  ];
  return (
    <Wrap>
      <Head eyebrow="How it works" title={<>From booking to feedback in <span className="mark">under 30 minutes</span></>} />
      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="relative">
            <span className="font-display text-6xl font-semibold text-line">{i + 1}</span>
            <div className="-mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand"><s.icon size={20} /></div>
            <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </Wrap>
  );
}

export function Features() {
  const items = [
    { icon: Mic, title: 'Speak, do not type', text: 'Hands-free voice conversation with live captions. If your microphone is not available, you can type instead.' },
    { icon: UserCheck, title: 'An interviewer for each stack', text: 'A DevOps engineer for Docker, a React specialist for MERN, a Python lead for Flask. Questions follow the topic and your level.' },
    { icon: ListChecks, title: 'Scores with reasons', text: 'Every answer is judged on accuracy, depth and communication against a written rubric, with advice you can act on.' },
    { icon: BookOpen, title: 'Docs you will finish', text: 'Short, structured guides for every technology with runnable code, terminal commands and a table of contents.' },
    { icon: Target, title: 'A real question bank', text: 'Industry-standard questions from beginner to senior. Hide the answers, test yourself, bookmark the hard ones.' },
    { icon: LineChart, title: 'Progress you can see', text: 'Every report is saved. Watch your score trend up and see which subject needs the next hour of study.' },
  ];
  return (
    <Wrap tint>
      <Head eyebrow="What you get" title="Everything you need to prepare, in one place" lead="Read the concept, test yourself on the questions, then say it out loud to an interviewer that pushes back." />
      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <div key={f.title} className="flex gap-4">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-brand"><f.icon size={18} /></span>
            <div><h3 className="text-lg font-semibold">{f.title}</h3><p className="mt-1.5 leading-relaxed text-muted">{f.text}</p></div>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function Technologies() {
  const { data } = useApi<Subject[]>('/content/subjects');
  return (
    <Wrap id="technologies">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Head eyebrow="Documentation" title="Ten technologies, each with full coverage" lead="Every technology has a complete docs section, from the basics to production topics, and ends with the interview questions that matter." />
        <Link href="/learn" className="btn-ghost">Browse all docs <ArrowRight size={14} className="ml-2" /></Link>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((s) => (
          <Link key={s.id} href={`/learn/${s.slug}`} className="card spot flex items-start gap-4 p-4" style={{ ['--accent' as string]: s.accent }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: s.accent, background: `color-mix(in srgb, ${s.accent} 14%, transparent)` }}><SubjectIcon name={s.icon} size={20} /></span>
            <span className="min-w-0"><span className="block font-semibold">{s.name}</span><span className="block text-sm text-muted">{s.topicCount} pages · {s.questionCount} questions</span></span>
          </Link>
        ))}
      </div>
    </Wrap>
  );
}

export function ReportPreview() {
  return (
    <Wrap tint>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Head eyebrow="Your report" title="Feedback that tells you what to do next" />
          <ul className="mt-6 space-y-3 text-muted">
            {['A verdict from Strong hire to Needs more practice', 'Scores for accuracy, depth and communication', 'Question by question notes on what you said', 'A study plan that links back to the docs'].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="card p-6 shadow-[0_30px_60px_-34px_rgb(var(--ink)/.35)]">
          <div className="flex items-center justify-between">
            <div><div className="eyebrow">Docker · DevOps Engineer</div><div className="mt-1 font-display text-5xl font-semibold">78<span className="text-xl text-muted"> / 100</span></div></div>
            <span className="rounded-md border border-good/40 bg-good/10 px-3 py-1 text-sm font-medium text-good">Hire</span>
          </div>
          {[['Technical accuracy', 84], ['Depth', 70], ['Communication', 80]].map(([l, v]) => (
            <div key={l as string} className="mt-4"><div className="flex justify-between text-sm"><span>{l}</span><b>{v}</b></div><div className="mt-1.5 h-2 rounded bg-subtle"><div className="h-full rounded bg-brand" style={{ width: `${v}%` }} /></div></div>
          ))}
          <div className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
            <div><div className="font-semibold text-good">Strengths</div><p className="mt-1 text-muted">Clear on image layers and multi-stage builds.</p></div>
            <div><div className="font-semibold text-warn">To improve</div><p className="mt-1 text-muted">Add a real example when you explain networking.</p></div>
          </div>
        </div>
      </div>
    </Wrap>
  );
}

export const FAQ = [
  ['How do the voice interviews work?', 'You join a room, the interviewer asks a question out loud and you answer. In Chrome and Edge your speech is turned into text automatically and the interviewer replies when you pause. In other browsers you can record answers or type them.'],
  ['Do I need a microphone?', 'No. A microphone gives the most realistic practice, but you can type every answer and read the interviewer on screen.'],
  ['How is my score calculated?', 'Each interview is scored on technical accuracy (45%), depth (30%) and communication (25%). The scorer follows a written rubric and explains the score for each question.'],
  ['Is my audio stored?', 'No. Audio is turned into text and discarded. We keep the transcript and your report so you can review them, and you can ask us to delete them at any time.'],
  ['Which technologies are covered?', 'MERN, React Native, Python, Flask and Django, Docker, DevOps and cloud, software engineering, data structures and algorithms, automata and AI. We add more over time.'],
  ['Is it free?', 'The documentation and question bank are free. Mock interviews have a free allowance and paid plans for more practice. See the pricing section for details.'],
];

export function Faq({ items = FAQ }: { items?: string[][] }) {
  return (
    <Wrap>
      <Head eyebrow="FAQ" title="Questions people ask before they start" />
      <div className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
        {items.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              {q}<span className="text-2xl leading-none text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Wrap>
  );
}

export function CtaBand() {
  const openAuth = useUi((s) => s.openAuth);
  return (
    <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="rounded-2xl bg-ink px-8 py-14 text-center text-canvas sm:px-16">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">The interview you rehearsed is the one you walk into calm.</h2>
        <p className="mx-auto mt-4 max-w-xl text-canvas/70">Create a free account and run your first mock interview today.</p>
        <button onClick={() => openAuth('register')} className="mt-8 inline-flex items-center rounded-lg bg-hi px-6 py-3 font-semibold text-[#1b1a17] transition hover:opacity-90">Start for free <ArrowRight size={16} className="ml-2" /></button>
      </div>
    </section>
  );
}

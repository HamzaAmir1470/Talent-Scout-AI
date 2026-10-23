'use client';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import DocsShell from '@/components/docs/DocsShell';
import DifficultyBadge, { LEVELS } from '@/components/DifficultyBadge';
import QuestionCard from '@/components/QuestionCard';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { slugify } from '@/lib/slug';
import { useApi } from '@/lib/useApi';
import { usePractice } from '@/store/practice';
import type { Difficulty, Question, Subject, TopicSummary } from '@/lib/types';

export default function SubjectQuestions() {
  const { subject } = useParams<{ subject: string }>();
  const subjects = useApi<Subject[]>('/content/subjects');
  const topics = useApi<TopicSummary[]>(`/content/topics?subject=${subject}`);
  const qs = useApi<Question[]>(`/content/questions?subject=${subject}`);
  const { selfTest, setSelfTest } = usePractice();
  const [level, setLevel] = useState<'all' | Difficulty>('all');
  const s = subjects.data?.find((x) => x.slug === subject);

  const groups = useMemo(() => {
    const filtered = (qs.data ?? []).filter((q) => level === 'all' || q.difficulty === level);
    return (topics.data ?? []).map((t) => ({ t, items: filtered.filter((q) => q.topicId === t.id) })).filter((g) => g.items.length);
  }, [qs.data, topics.data, level]);

  const toc = groups.map((g) => ({ level: 2 as const, text: g.t.title, id: slugify(g.t.title) }));
  const total = qs.data?.length ?? 0;

  return (
    <DocsShell subject={s} topics={(topics.data ?? []).map((t) => ({ slug: t.slug, title: t.title, section: t.section }))} activeSlug="interview-questions" questionCount={s?.questionCount} toc={toc}>
      <p className="eyebrow">{s?.name ?? 'Interview questions'}</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Top {s?.name} interview questions</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">The {total || ''} questions interviewers ask most, grouped by topic and ordered from beginner to senior. Hide the answers, say yours out loud, then check.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button onClick={() => setLevel('all')} className={`chip ${level === 'all' ? 'chip-active' : 'hover:bg-subtle'}`}>All levels</button>
        {(Object.keys(LEVELS) as Difficulty[]).map((l) => <button key={l} onClick={() => setLevel(l)} className={`chip ${level === l ? 'chip-active' : 'hover:bg-subtle'}`}><DifficultyBadge level={l} /></button>)}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted"><input type="checkbox" className="h-4 w-4 accent-brand" checked={selfTest} onChange={(e) => setSelfTest(e.target.checked)} /> Hide answers (self-test)</label>
      </div>

      {qs.error && <div className="mt-6"><ErrorBox message={qs.error} /></div>}
      {qs.loading && <div className="mt-8 space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}</div>}
      {groups.map((g) => (
        <section key={g.t.id} className="mt-12">
          <h2 id={slugify(g.t.title)} className="scroll-mt-24 border-b border-line pb-3 text-2xl font-semibold">{g.t.title}</h2>
          <div className="mt-5 space-y-4">{g.items.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}</div>
        </section>
      ))}
      {!qs.loading && groups.length === 0 && !qs.error && <div className="card mt-10 p-10 text-center text-muted">No questions at this level yet.</div>}
    </DocsShell>
  );
}

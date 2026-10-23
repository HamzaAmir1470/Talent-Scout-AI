'use client';
import { useMemo } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import SubjectCard from '@/components/SubjectCard';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';
import { useUi } from '@/store/ui';
import type { Subject } from '@/lib/types';

export default function LearnPage() {
  const { data, error, loading } = useApi<Subject[]>('/content/subjects');
  const setSearchOpen = useUi((s) => s.setSearchOpen);

  const groups = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const s of data ?? []) map.set(s.group, [...(map.get(s.group) ?? []), s]);
    return [...map.entries()];
  }, [data]);
  const pages = data?.reduce((n, s) => n + s.topicCount, 0) ?? 0;
  const questions = data?.reduce((n, s) => n + s.questionCount, 0) ?? 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 sm:px-6">
        <p className="eyebrow">Documentation</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Learn every technology, <span className="mark">then get quizzed on it</span></h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {data ? `${data.length} technologies, ${pages} pages and ${questions} interview questions.` : 'Structured guides for every technology.'} Each guide covers the basics through to production topics and finishes with the questions interviewers ask.
        </p>
        <button onClick={() => setSearchOpen(true)} className="mt-7 flex h-12 w-full max-w-xl items-center gap-3 rounded-lg border border-line bg-surface px-4 text-left text-muted transition hover:border-faint">
          <Search size={17} /> Search the documentation <kbd className="ml-auto rounded border border-line px-1.5 text-xs">Ctrl K</kbd>
        </button>

        {error && <div className="mt-8"><ErrorBox message={error} /></div>}
        {loading && <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>}

        {groups.map(([group, subjects]) => (
          <section key={group} className="mt-14">
            <h2 className="mb-5 flex items-center gap-4 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-muted">{group}<span className="h-px flex-1 bg-line" /></h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{subjects.map((s, i) => <SubjectCard key={s.id} s={s} index={i} />)}</div>
          </section>
        ))}
      </main>
    </>
  );
}

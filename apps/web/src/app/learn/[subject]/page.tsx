'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Clock, HelpCircle } from 'lucide-react';
import DocsShell from '@/components/docs/DocsShell';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { SubjectIcon } from '@/lib/icons';
import { useApi } from '@/lib/useApi';
import type { Subject, TopicSummary } from '@/lib/types';

export default function SubjectPage() {
  const { subject } = useParams<{ subject: string }>();
  const subjects = useApi<Subject[]>('/content/subjects');
  const topics = useApi<TopicSummary[]>(`/content/topics?subject=${subject}`);
  const s = subjects.data?.find((x) => x.slug === subject);
  const list = topics.data ?? [];
  const sections = list.reduce<[string, TopicSummary[]][]>((acc, t) => {
    const last = acc[acc.length - 1];
    const name = t.section ?? 'Guides';
    if (last && last[0] === name) last[1].push(t); else acc.push([name, [t]]);
    return acc;
  }, []);
  const minutes = list.reduce((n, t) => n + t.minutes, 0);
  let n = 0;

  return (
    <DocsShell subject={s} topics={list.map((t) => ({ slug: t.slug, title: t.title, section: t.section }))} questionCount={s?.questionCount}>
      {topics.error && <ErrorBox message={topics.error} />}
      {!s && !topics.error && <Skeleton className="h-40" />}
      {s && (
        <>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ color: s.accent, background: `color-mix(in srgb, ${s.accent} 14%, transparent)` }}><SubjectIcon name={s.icon} size={28} /></span>
            <div><p className="eyebrow">Documentation</p><h1 className="text-4xl font-semibold leading-tight">{s.name}</h1></div>
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{s.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip">{s.topicCount} pages</span>
            <span className="chip"><Clock size={12} /> about {minutes} min of reading</span>
            <span className="chip"><HelpCircle size={12} /> {s.questionCount} interview questions</span>
          </div>
          {list[0] && <Link href={`/learn/${s.slug}/${list[0].slug}`} className="btn-primary mt-7 inline-flex items-center gap-2">Start reading <ArrowRight size={15} /></Link>}

          <h2 className="mt-14 text-2xl font-semibold">What you will learn</h2>
          {sections.map(([name, items]) => (
            <section key={name} className="mt-8">
              <p className="eyebrow mb-3">{name}</p>
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {items.map((t) => (
                  <Link key={t.id} href={`/learn/${s.slug}/${t.slug}`} className="group flex items-start gap-4 p-4 transition hover:bg-subtle">
                    <span className="mt-0.5 w-6 font-display text-lg text-faint">{++n}</span>
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{t.title}</span><span className="block text-sm text-muted">{t.summary}</span></span>
                    <span className="hidden shrink-0 text-xs text-muted sm:block">{t.minutes} min · {t.questionCount} Q</span>
                    <ArrowRight size={16} className="mt-1 text-faint transition group-hover:translate-x-1 group-hover:text-brand" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <Link href={`/learn/${s.slug}/interview-questions`} className="card spot mt-10 flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-hi/25 text-ink"><HelpCircle size={22} /></span>
            <span className="flex-1"><span className="block font-semibold">Top {s.name} interview questions</span><span className="block text-sm text-muted">All {s.questionCount} questions in one place, from beginner to senior.</span></span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
        </>
      )}
    </DocsShell>
  );
}

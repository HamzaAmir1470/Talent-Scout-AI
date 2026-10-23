'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, HelpCircle } from 'lucide-react';
import DocsShell from '@/components/docs/DocsShell';
import Markdown from '@/components/Markdown';
import QuestionCard from '@/components/QuestionCard';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { extractToc } from '@/lib/slug';
import { useApi } from '@/lib/useApi';
import { usePractice } from '@/store/practice';
import type { Subject, TopicPageData } from '@/lib/types';

function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setPct]);
  return <div className="fixed left-0 top-0 z-[60] h-0.5 bg-brand" style={{ width: `${pct}%` }} />;
}

export default function TopicPage() {
  const { subject, topic } = useParams<{ subject: string; topic: string }>();
  const page = useApi<TopicPageData>(`/content/topics/${subject}/${topic}`);
  const subjects = useApi<Subject[]>('/content/subjects');
  const { selfTest, setSelfTest } = usePractice();
  const d = page.data;
  const s = subjects.data?.find((x) => x.slug === subject);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [subject, topic]);

  const toc = useMemo(() => {
    if (!d?.documentation) return [];
    const items = extractToc(d.documentation.markdown);
    return d.questions.length ? [...items, { level: 2 as const, text: 'Interview questions', id: 'interview-questions' }] : items;
  }, [d]);

  const idx = d ? d.siblings.findIndex((x) => x.slug === topic) : -1;
  const prev = d && idx > 0 ? d.siblings[idx - 1] : null;
  const next = d && idx >= 0 && idx < d.siblings.length - 1 ? d.siblings[idx + 1] : null;
  const section = d?.siblings[idx]?.section;

  return (
    <>
      <ReadingProgress />
      <DocsShell subject={s ?? (d?.subject as Subject | undefined)} topics={d?.siblings ?? []} activeSlug={topic} questionCount={s?.questionCount} toc={toc}>
        {page.error && <ErrorBox message={page.error} />}
        {page.loading && <div className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-12 w-2/3" /><Skeleton className="h-96" /></div>}
        {d && (
          <article>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Link href="/learn" className="hover:text-ink">Docs</Link>/
              <Link href={`/learn/${subject}`} className="hover:text-ink">{d.subject.name}</Link>
              {section && <>/ <span>{section}</span></>}
            </nav>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{d.topic.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{d.topic.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2 border-b border-line pb-6">
              <span className="chip"><Clock size={12} /> {d.topic.minutes} min read</span>
              <span className="chip"><HelpCircle size={12} /> {d.questions.length} interview questions</span>
            </div>

            <div className="mt-8">
              {d.documentation ? <Markdown>{d.documentation.markdown}</Markdown> : <p className="text-muted">This page is being written.</p>}
            </div>

            {d.questions.length > 0 && (
              <section id="interview-questions" className="mt-14 scroll-mt-24 border-t border-line pt-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Interview questions</h2>
                    <p className="mt-1 text-muted">The questions interviewers ask most on this topic, from beginner to senior.</p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                    <input type="checkbox" className="h-4 w-4 accent-brand" checked={selfTest} onChange={(e) => setSelfTest(e.target.checked)} /> Hide answers (self-test)
                  </label>
                </div>
                <div className="mt-6 space-y-4">{d.questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}</div>
              </section>
            )}

            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              {prev ? (
                <Link href={`/learn/${subject}/${prev.slug}`} className="card spot group p-4">
                  <span className="eyebrow flex items-center gap-1.5"><ArrowLeft size={13} /> Previous</span><span className="mt-1 block font-semibold">{prev.title}</span>
                </Link>
              ) : <span />}
              <Link href={next ? `/learn/${subject}/${next.slug}` : `/learn/${subject}/interview-questions`} className="card spot group p-4 text-right">
                <span className="eyebrow flex items-center justify-end gap-1.5">{next ? 'Next' : 'Finish with'} <ArrowRight size={13} /></span>
                <span className="mt-1 block font-semibold">{next ? next.title : `All ${d.subject.name} interview questions`}</span>
              </Link>
            </div>
          </article>
        )}
      </DocsShell>
    </>
  );
}

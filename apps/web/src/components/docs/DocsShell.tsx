'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import { SubjectIcon } from '@/lib/icons';
import { useApi } from '@/lib/useApi';
import type { Subject } from '@/lib/types';
import type { TocItem } from '@/lib/slug';
import Toc from './Toc';

export interface NavTopic { slug: string; title: string; section?: string; minutes?: number }

function Sidebar({ subject, topics, activeSlug, questionCount }: { subject: Subject | undefined; topics: NavTopic[]; activeSlug?: string; questionCount?: number }) {
  const router = useRouter();
  const all = useApi<Subject[]>('/content/subjects');
  const sections = topics.reduce<[string, NavTopic[]][]>((acc, t) => {
    const name = t.section ?? 'Guides';
    const last = acc[acc.length - 1];
    if (last && last[0] === name) last[1].push(t); else acc.push([name, [t]]);
    return acc;
  }, []);

  return (
    <nav aria-label="Documentation" className="text-sm">
      <select aria-label="Switch technology" className="input mb-5 font-medium" value={subject?.slug ?? ''} onChange={(e) => router.push(`/learn/${e.target.value}`)}>
        {!subject && <option value="">Loading...</option>}
        {(all.data ?? (subject ? [subject] : [])).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
      {subject && (
        <Link href={`/learn/${subject.slug}`} className={`mb-4 flex items-center gap-2 rounded-md px-2 py-1.5 font-semibold ${!activeSlug ? 'text-brand' : 'hover:text-brand'}`}>
          <span style={{ color: subject.accent }}><SubjectIcon name={subject.icon} size={16} /></span> Overview
        </Link>
      )}
      {sections.map(([name, items]) => (
        <div key={name} className="mb-5">
          <p className="eyebrow mb-2 px-2">{name}</p>
          <ul className="border-l border-line">
            {items.map((t) => {
              const on = t.slug === activeSlug;
              return (
                <li key={t.slug}>
                  <Link href={`/learn/${subject?.slug}/${t.slug}`} aria-current={on ? 'page' : undefined}
                    className={`-ml-px block border-l-2 py-1.5 pl-4 pr-2 transition ${on ? 'border-brand bg-brand/5 font-medium text-brand' : 'border-transparent text-muted hover:border-faint hover:text-ink'}`}>
                    {t.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {subject && (
        <div className="mt-2 border-t border-line pt-4">
          <Link href={`/learn/${subject.slug}/interview-questions`}
            className={`flex items-center gap-2 rounded-md px-2 py-2 font-semibold transition ${activeSlug === 'interview-questions' ? 'bg-brand/10 text-brand' : 'hover:bg-subtle'}`}>
            <HelpCircle size={16} /> Interview questions
            {questionCount !== undefined && <span className="ml-auto rounded bg-subtle px-1.5 text-xs text-muted">{questionCount}</span>}
          </Link>
        </div>
      )}
    </nav>
  );
}

export default function DocsShell({ subject, topics, activeSlug, questionCount, toc, children }: {
  subject?: Subject; topics: NavTopic[]; activeSlug?: string; questionCount?: number; toc?: TocItem[]; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Header />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium lg:hidden">
          Browse {subject?.name ?? 'documentation'} <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div className="mt-3 rounded-lg border border-line bg-surface p-4 lg:hidden"><Sidebar subject={subject} topics={topics} activeSlug={activeSlug} questionCount={questionCount} /></div>}

        <div className={`grid gap-10 py-8 lg:grid-cols-[250px_minmax(0,1fr)] ${toc?.length ? 'xl:grid-cols-[250px_minmax(0,1fr)_210px]' : ''}`}>
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6 pr-2 no-scrollbar">
              <Sidebar subject={subject} topics={topics} activeSlug={activeSlug} questionCount={questionCount} />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
          {toc?.length ? <aside className="hidden xl:block"><div className="sticky top-24">{<Toc items={toc} />}</div></aside> : null}
        </div>
      </div>
    </>
  );
}

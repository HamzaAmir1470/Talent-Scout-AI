'use client';
import { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, CheckCircle2, Eye, EyeOff, Lightbulb, RotateCcw } from 'lucide-react';
import type { Question } from '@/lib/types';
import { usePractice } from '@/store/practice';
import DifficultyBadge from './DifficultyBadge';
import Markdown, { fence } from './Markdown';

const Label = ({ children }: { children: React.ReactNode }) => <h4 className="eyebrow mb-1.5 font-sans">{children}</h4>;

function QuestionCard({ q }: { q: Question; index?: number }) {
  const bookmarked = usePractice((s) => Boolean(s.bookmarks[q.key]));
  const status = usePractice((s) => s.progress[q.key]);
  const selfTest = usePractice((s) => s.selfTest);
  const toggleBookmark = usePractice((s) => s.toggleBookmark);
  const setProgress = usePractice((s) => s.setProgress);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(!selfTest), [selfTest]);

  return (
    <article className="card p-5 sm:p-6" aria-labelledby={`q-${q.key}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <DifficultyBadge level={q.difficulty} />
        <Link href={`/learn/${q.subjectSlug}/${q.topicSlug}`} className="flex min-w-0 items-center gap-2 text-sm text-muted hover:text-ink">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: q.subjectAccent }} />
          <span className="truncate">{q.subjectName} · {q.topicTitle}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {status && (
            <span className={`mr-1 flex items-center gap-1 text-xs font-medium ${status === 'known' ? 'text-good' : 'text-warn'}`}>
              {status === 'known' ? <CheckCircle2 size={13} /> : <RotateCcw size={13} />}{status === 'known' ? 'Nailed it' : 'Review'}
            </span>
          )}
          <button onClick={() => toggleBookmark(q.key)} aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-ink">
            <Bookmark size={18} className={bookmarked ? 'fill-hi text-hi' : ''} />
          </button>
        </div>
      </div>

      <h3 id={`q-${q.key}`} className="mt-3 text-lg font-semibold leading-snug">{q.question}</h3>

      {!revealed ? (
        <button onClick={() => setRevealed(true)} aria-expanded={false} className="btn-primary mt-5 gap-2"><Eye size={15} /> Show answer</button>
      ) : (
        <div className="mt-5 space-y-5 border-t border-line pt-5">
          <section><Label>Answer</Label><Markdown compact>{q.answer}</Markdown></section>
          {q.codeSnippet && <section><Label>Example</Label><Markdown compact>{fence(q.codeLanguage ?? 'javascript', q.codeSnippet)}</Markdown></section>}
          {q.devopsCommand && <section><Label>In the terminal</Label><Markdown compact>{fence('bash', q.devopsCommand)}</Markdown></section>}
          <aside className="flex gap-3 rounded-lg border border-hi/40 bg-hi/10 p-3.5">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-warn" />
            <div><div className="eyebrow">Key takeaway</div><p className="mt-0.5 text-sm font-medium">{q.keyTakeaway}</p></div>
          </aside>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setProgress(q.key, status === 'known' ? null : 'known')} aria-pressed={status === 'known'}
              className={`btn-ghost gap-2 ${status === 'known' ? 'border-good bg-good/10 text-good' : ''}`}><CheckCircle2 size={15} /> I nailed it</button>
            <button onClick={() => setProgress(q.key, status === 'review' ? null : 'review')} aria-pressed={status === 'review'}
              className={`btn-ghost gap-2 ${status === 'review' ? 'border-warn bg-warn/10 text-warn' : ''}`}><RotateCcw size={15} /> Review again</button>
            {selfTest && <button onClick={() => setRevealed(false)} className="ml-auto flex items-center gap-1.5 text-sm text-muted hover:text-ink"><EyeOff size={14} /> Hide answer</button>}
          </div>
        </div>
      )}
    </article>
  );
}

export default memo(QuestionCard);

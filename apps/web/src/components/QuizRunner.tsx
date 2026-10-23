'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, RotateCcw, Shuffle, XCircle } from 'lucide-react';
import type { Question } from '@/lib/types';
import { usePractice, type Progress } from '@/store/practice';
import DifficultyBadge from './DifficultyBadge';
import Markdown, { fence } from './Markdown';

const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** One question at a time. Say the answer out loud, reveal it, then mark how you did. */
export default function QuizRunner({ pool }: { pool: Question[] }) {
  const setProgress = usePractice((s) => s.setProgress);
  const [size, setSize] = useState(10);
  const [deck, setDeck] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [res, setRes] = useState<Record<string, Progress>>({});

  const start = (list: Question[], limit: number) => { setDeck(shuffle(list).slice(0, limit)); setI(0); setShown(false); setRes({}); };
  const answer = useCallback((status: Progress) => {
    if (!deck) return;
    setProgress(deck[i].key, status);
    setRes((r) => ({ ...r, [deck[i].key]: status }));
    setShown(false);
    setI((n) => n + 1);
  }, [deck, i, setProgress]);

  useEffect(() => {
    if (!deck || i >= deck.length) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setShown(true); }
      else if (shown && e.key === '1') answer('review');
      else if (shown && e.key === '2') answer('known');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck, i, shown, answer]);

  if (!deck) {
    return (
      <div className="card p-8 text-center">
        <Shuffle className="mx-auto text-brand" size={28} />
        <h2 className="mt-3 text-2xl font-semibold">Quiz yourself</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">Random questions from your current filters, one at a time. Answer out loud first, then check yourself.</p>
        {pool.length === 0 ? <p className="mt-6 text-warn">No questions match your filters. Widen them to start a quiz.</p> : (
          <>
            <div className="mt-6 flex justify-center gap-2" role="group" aria-label="Number of questions">
              {[5, 10, 20].map((n) => <button key={n} onClick={() => setSize(n)} className={`chip px-4 py-2 text-sm ${size === n ? 'chip-active' : 'hover:bg-subtle'}`}>{n} questions</button>)}
            </div>
            <button className="btn-primary mt-6 px-8 py-3" onClick={() => start(pool, size)}>Start quiz ({Math.min(size, pool.length)})</button>
          </>
        )}
      </div>
    );
  }

  if (i >= deck.length) {
    const known = deck.filter((q) => res[q.key] === 'known').length;
    const missed = deck.filter((q) => res[q.key] === 'review');
    const pct = Math.round((known / deck.length) * 100);
    return (
      <div className="card p-6 sm:p-8">
        <p className="eyebrow">Quiz complete</p>
        <div className="mt-2 flex flex-wrap items-end gap-3"><span className="font-display text-6xl font-semibold leading-none">{pct}%</span><span className="pb-1 text-muted">{known} of {deck.length} nailed</span></div>
        <div className="mt-4 h-2.5 overflow-hidden rounded bg-subtle"><div className="h-full rounded bg-brand" style={{ width: `${pct}%` }} /></div>
        {missed.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold">Worth another look</h3>
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {missed.map((q) => (
                <li key={q.key} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1">{q.question}</span>
                  <Link href={`/learn/${q.subjectSlug}/${q.topicSlug}`} className="link shrink-0">Read the guide</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {missed.length > 0 && <button className="btn-primary gap-2" onClick={() => start(missed, missed.length)}><RotateCcw size={15} /> Retry the {missed.length} missed</button>}
          <button className="btn-ghost" onClick={() => start(pool, size)}>New quiz</button>
          <button className="btn-ghost" onClick={() => setDeck(null)}>Change settings</button>
        </div>
      </div>
    );
  }

  const q = deck[i];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted"><span>Question {i + 1} of {deck.length}</span><button className="hover:text-ink" onClick={() => setDeck(null)}>End quiz</button></div>
      <div className="mb-5 h-1.5 overflow-hidden rounded bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={i}><div className="h-full rounded bg-brand transition-all" style={{ width: `${(i / deck.length) * 100}%` }} /></div>
      <article className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3"><DifficultyBadge level={q.difficulty} /><span className="text-sm text-muted">{q.subjectName} · {q.topicTitle}</span></div>
        <h2 className="mt-4 text-2xl font-semibold leading-snug">{q.question}</h2>
        {!shown ? (
          <>
            <button className="btn-primary mt-8 gap-2 px-6 py-3" onClick={() => setShown(true)}><Eye size={16} /> Show answer</button>
            <p className="mt-3 text-xs text-muted">Tip: press Space to reveal.</p>
          </>
        ) : (
          <div className="mt-6 space-y-5 border-t border-line pt-6">
            <Markdown compact>{q.answer}</Markdown>
            {q.codeSnippet && <Markdown compact>{fence(q.codeLanguage ?? 'javascript', q.codeSnippet)}</Markdown>}
            {q.devopsCommand && <Markdown compact>{fence('bash', q.devopsCommand)}</Markdown>}
            <p className="rounded-lg border border-hi/40 bg-hi/10 p-3 text-sm"><b>Key takeaway:</b> {q.keyTakeaway}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="btn-ghost justify-center gap-2 border-warn/50 py-3 text-warn" onClick={() => answer('review')}><XCircle size={16} /> Missed it <kbd className="ml-1 rounded border border-line px-1 text-[11px]">1</kbd></button>
              <button className="btn-primary justify-center gap-2 py-3" onClick={() => answer('known')}><CheckCircle2 size={16} /> Got it <kbd className="ml-1 rounded border border-on-brand/40 px-1 text-[11px]">2</kbd></button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

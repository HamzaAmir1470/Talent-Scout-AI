'use client';
import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, ListChecks, RotateCcw, Search, Shuffle, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import { LEVELS } from '@/components/DifficultyBadge';
import ProgressRing from '@/components/ProgressRing';
import QuestionCard from '@/components/QuestionCard';
import QuizRunner from '@/components/QuizRunner';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';
import { usePractice } from '@/store/practice';
import type { Difficulty, Question, Subject, TopicSummary } from '@/lib/types';

const PAGE = 10;

function Switch({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} className="flex w-full items-start justify-between gap-4 text-left text-sm">
      <span><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <span className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export default function PracticePage() {
  const subjects = useApi<Subject[]>('/content/subjects');
  const topics = useApi<TopicSummary[]>('/content/topics');
  const questions = useApi<Question[]>('/content/questions');
  const bookmarks = usePractice((s) => s.bookmarks);
  const progress = usePractice((s) => s.progress);
  const selfTest = usePractice((s) => s.selfTest);
  const setSelfTest = usePractice((s) => s.setSelfTest);

  const [mode, setMode] = useState<'browse' | 'quiz'>('browse');
  const [subject, setSubject] = useState('all');
  const [topicId, setTopicId] = useState('all');
  const [level, setLevel] = useState<'all' | Difficulty>('all');
  const [search, setSearch] = useState('');
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [onlyReview, setOnlyReview] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => setTopicId('all'), [subject]);
  useEffect(() => setVisible(PAGE), [subject, topicId, level, search, onlyMarked, onlyReview, mode]);

  const topicOptions = useMemo(() => (topics.data ?? []).filter((t) => subject === 'all' || t.subjectSlug === subject), [topics.data, subject]);
  const all = questions.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((q) =>
      (subject === 'all' || q.subjectSlug === subject) && (topicId === 'all' || q.topicId === topicId) &&
      (level === 'all' || q.difficulty === level) && (!onlyMarked || bookmarks[q.key]) && (!onlyReview || progress[q.key] === 'review') &&
      (!term || q.question.toLowerCase().includes(term) || q.topicTitle.toLowerCase().includes(term)));
  }, [all, subject, topicId, level, search, onlyMarked, onlyReview, bookmarks, progress]);

  const known = all.filter((q) => progress[q.key] === 'known').length;
  const review = all.filter((q) => progress[q.key] === 'review').length;
  const marked = all.filter((q) => bookmarks[q.key]).length;
  const pct = all.length ? known / all.length : 0;
  const activeFilters = [subject !== 'all', topicId !== 'all', level !== 'all', !!search, onlyMarked, onlyReview].filter(Boolean).length;
  const reset = () => { setSubject('all'); setTopicId('all'); setLevel('all'); setSearch(''); setOnlyMarked(false); setOnlyReview(false); };

  const filters = (
    <div className="space-y-6">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input className="input pl-9" placeholder="Search questions" aria-label="Search questions" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div>
        <div className="eyebrow mb-2">Technology</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSubject('all')} className={`chip ${subject === 'all' ? 'chip-active' : 'hover:bg-subtle'}`}>All</button>
          {subjects.data?.map((s) => (
            <button key={s.slug} onClick={() => setSubject(s.slug)} className={`chip ${subject === s.slug ? 'chip-active' : 'hover:bg-subtle'}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: s.accent }} />{s.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="topic" className="eyebrow mb-2 block">Topic</label>
        <select id="topic" className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          <option value="all">All topics</option>
          {topicOptions.map((t) => <option key={t.id} value={t.id}>{subject === 'all' ? `${t.subjectName}: ` : ''}{t.title}</option>)}
        </select>
      </div>
      <div>
        <div className="eyebrow mb-2">Level</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setLevel('all')} className={`chip justify-center ${level === 'all' ? 'chip-active' : 'hover:bg-subtle'}`}>All levels</button>
          {(Object.keys(LEVELS) as Difficulty[]).map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={`chip justify-center ${level === l ? 'chip-active' : 'hover:bg-subtle'}`}><span className={`h-2 w-2 rounded-full ${LEVELS[l].dot}`} />{LEVELS[l].label}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4 border-t border-line pt-5">
        <Switch on={selfTest} onChange={setSelfTest} label="Self-test mode" hint="Hide answers until you reveal them" />
        <Switch on={onlyMarked} onChange={setOnlyMarked} label="Bookmarked only" />
        <Switch on={onlyReview} onChange={setOnlyReview} label="Marked for review" />
      </div>
      {activeFilters > 0 && <button onClick={reset} className="text-sm font-medium text-brand hover:underline">Clear all filters</button>}
    </div>
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 pb-16 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Question bank</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Drill until it <span className="text-gradient">sticks</span></h1>
            <p className="mt-3 max-w-xl text-muted">Real interview questions from beginner to senior. Read and test yourself, or run a quick quiz.</p>
          </div>
          {ready && all.length > 0 && (
            <div className="card flex items-center gap-5 p-4">
              <div className="relative"><ProgressRing value={pct} size={72} /><span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{Math.round(pct * 100)}%</span></div>
              <dl className="grid grid-cols-3 gap-5 text-center text-xs text-muted">
                <div><CheckCircle2 size={15} className="mx-auto text-good" /><dd className="mt-1 text-lg font-semibold text-ink">{known}</dd><dt>Nailed</dt></div>
                <div><RotateCcw size={15} className="mx-auto text-warn" /><dd className="mt-1 text-lg font-semibold text-ink">{review}</dd><dt>Review</dt></div>
                <div><Bookmark size={15} className="mx-auto text-brand" /><dd className="mt-1 text-lg font-semibold text-ink">{marked}</dd><dt>Saved</dt></div>
              </dl>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-line bg-surface p-1" role="tablist" aria-label="Practice mode">
            {([['browse', 'Browse', ListChecks], ['quiz', 'Quiz me', Shuffle]] as const).map(([k, label, Icon]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${mode === k ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`}><Icon size={15} />{label}</button>
            ))}
          </div>
          <button onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} className="btn-ghost gap-2 lg:hidden"><SlidersHorizontal size={15} /> Filters{activeFilters ? ` (${activeFilters})` : ''}</button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="card p-5 lg:sticky lg:top-24">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={15} /> Filters</div>
              {filters}
            </div>
          </aside>

          <section className="min-w-0">
            {questions.error && <ErrorBox message={questions.error} />}
            {questions.loading && <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>}
            {ready && !questions.loading && !questions.error && mode === 'quiz' && <QuizRunner pool={filtered} />}
            {ready && !questions.loading && !questions.error && mode === 'browse' && (
              <>
                <p className="mb-4 text-sm text-muted">Showing <b className="text-ink">{Math.min(visible, filtered.length)}</b> of {filtered.length} questions{filtered.length !== all.length && ` (${all.length} total)`}</p>
                <div className="space-y-4">{filtered.slice(0, visible).map((q) => <QuestionCard key={q.id} q={q} />)}</div>
                {visible < filtered.length && <button onClick={() => setVisible((v) => v + PAGE)} className="btn-ghost mx-auto mt-6 flex px-8">Show {Math.min(PAGE, filtered.length - visible)} more</button>}
                {filtered.length === 0 && (
                  <div className="card p-10 text-center">
                    <p className="font-medium">No questions match these filters.</p>
                    {activeFilters > 0 && <button onClick={reset} className="btn-ghost mt-4">Clear filters</button>}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

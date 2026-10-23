'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, FileText, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useUi } from '@/store/ui';
import type { TopicSummary } from '@/lib/types';

export default function SearchPalette() {
  const { searchOpen, setSearchOpen } = useUi();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    setQ(''); setActive(0);
    if (!loaded.current) {
      loaded.current = true;
      api.get<TopicSummary[]>('/content/topics').then((r) => setTopics(r.data)).catch(() => { loaded.current = false; });
    }
  }, [searchOpen]);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = words.length
      ? topics.filter((t) => words.every((w) => `${t.title} ${t.summary} ${t.subjectName}`.toLowerCase().includes(w)))
      : topics;
    return list.slice(0, 8);
  }, [q, topics]);

  function go(t: TopicSummary) { setSearchOpen(false); router.push(`/learn/${t.subjectSlug}/${t.slug}`); }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) go(results[active]);
  }

  if (!searchOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/40 p-4 pt-[12vh]" onMouseDown={() => setSearchOpen(false)} role="dialog" aria-modal aria-label="Search documentation">
      <div className="card w-full max-w-xl overflow-hidden shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey}
            placeholder="Search documentation" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
          <kbd className="rounded border border-line px-1.5 text-[11px] text-muted">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((t, i) => (
            <li key={t.id}>
              <button onClick={() => go(t)} onMouseEnter={() => setActive(i)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left ${i === active ? 'bg-subtle' : ''}`}>
                <FileText size={16} className="mt-0.5 shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{t.title}</span>
                  <span className="block truncate text-xs text-muted">{t.subjectName} · {t.summary}</span>
                </span>
                {i === active && <CornerDownLeft size={14} className="mt-1 text-muted" />}
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">No pages match that search.</li>}
        </ul>
      </div>
    </div>
  );
}

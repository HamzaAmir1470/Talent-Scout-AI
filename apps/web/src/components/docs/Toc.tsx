'use client';
import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/slug';

export default function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.id);
    }, { rootMargin: '-90px 0px -65% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="eyebrow mb-3">On this page</p>
      <ul className="space-y-2 border-l border-line">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className={`-ml-px block border-l-2 py-0.5 transition ${i.level === 3 ? 'pl-7' : 'pl-4'} ${active === i.id ? 'border-brand font-medium text-brand' : 'border-transparent text-muted hover:text-ink'}`}>{i.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

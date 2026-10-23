'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Subject } from '@/lib/types';
import { SubjectIcon } from '@/lib/icons';

export default function SubjectCard({ s, index = 0 }: { s: Subject; index?: number }) {
  return (
    <Link href={`/learn/${s.slug}`} className="card spot rise group flex flex-col p-5" style={{ ['--accent' as string]: s.accent, animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ color: s.accent, background: `color-mix(in srgb, ${s.accent} 14%, transparent)` }}>
          <SubjectIcon name={s.icon} size={22} />
        </span>
        <ArrowUpRight size={18} className="text-faint transition group-hover:text-brand" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">{s.name}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{s.description}</p>
      <p className="mt-4 text-xs text-muted"><b className="text-ink">{s.topicCount}</b> pages · <b className="text-ink">{s.questionCount}</b> interview questions</p>
    </Link>
  );
}

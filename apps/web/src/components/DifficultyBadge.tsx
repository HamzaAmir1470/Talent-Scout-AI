import type { Difficulty } from '@/lib/types';

export const LEVELS: Record<Difficulty, { label: string; cls: string; dot: string }> = {
  beginner: { label: 'Beginner', cls: 'border-good/30 bg-good/10 text-good', dot: 'bg-good' },
  intermediate: { label: 'Intermediate', cls: 'border-warn/30 bg-warn/10 text-warn', dot: 'bg-warn' },
  senior: { label: 'Senior', cls: 'border-bad/30 bg-bad/10 text-bad', dot: 'bg-bad' },
};

export default function DifficultyBadge({ level }: { level: Difficulty }) {
  const m = LEVELS[level];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.label}
    </span>
  );
}

import { Check, Lightbulb } from 'lucide-react';
import { STEPS, TIPS, stepOf, type Stage } from '@/lib/stages';

export default function StageTracker({ stage }: { stage: Stage }) {
  const current = stepOf(stage);
  return (
    <div>
      <ol className="flex items-center gap-1" aria-label="Interview progress">
        {STEPS.map((label, i) => {
          const done = i < current;
          const on = i === current;
          return (
            <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={on ? 'step' : undefined}>
              <span className={`h-1.5 rounded-full transition-colors ${done ? 'bg-brand' : on ? 'bg-brand/60' : 'bg-line'}`} />
              <span className={`flex items-center gap-1 truncate text-[11px] font-medium ${on ? 'text-ink' : 'text-muted'}`}>
                {done && <Check size={11} className="shrink-0 text-brand" />}<span className="truncate">{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex gap-2 rounded-lg bg-hi/10 p-3 text-sm text-ink2" role="note">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-warn" /><span><b className="text-ink">Tip:</b> {TIPS[stage]}</span>
      </p>
    </div>
  );
}

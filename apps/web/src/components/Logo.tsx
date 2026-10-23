import { SITE } from '@/lib/site';

export default function Logo({ size = 30, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="rgb(var(--brand))" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="rgb(var(--on-brand))" strokeWidth="2.2" />
        <path d="M16 4.5v5M16 22.5v5M4.5 16h5M22.5 16h5" stroke="rgb(var(--on-brand))" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.8" fill="rgb(var(--hi))" />
      </svg>
      {text && <span className="font-display text-[1.15rem] font-semibold leading-none tracking-tight">{SITE.name.replace(' AI', '')} <span className="text-brand">AI</span></span>}
    </span>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useUi } from '@/store/ui';

interface Plan {
  id: string; name: string; blurb: string; monthly: number | null; yearly: number | null;
  cta: string; featured?: boolean; features: { text: string; soon?: boolean }[];
}

const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', blurb: 'Learn the material and try the interview room.', monthly: 0, yearly: 0, cta: 'Create free account',
    features: [{ text: 'All documentation and guides' }, { text: 'Full question bank with self-test' }, { text: '2 AI mock interviews a month' }, { text: 'Sessions up to 15 minutes' }, { text: 'Scored report with three criteria' }] },
  { id: 'pro', name: 'Pro', blurb: 'For anyone interviewing in the next few weeks.', monthly: 19, yearly: 15, cta: 'Get early access', featured: true,
    features: [{ text: 'Everything in Starter' }, { text: '20 AI mock interviews a month' }, { text: 'Sessions up to 45 minutes' }, { text: 'All ten interviewer personas' }, { text: 'Question by question feedback and study plan' }, { text: 'Progress history, trends and calendar invites' }] },
  { id: 'teams', name: 'Teams', blurb: 'Bootcamps, universities and hiring programs.', monthly: null, yearly: null, cta: 'Talk to us',
    features: [{ text: 'Everything in Pro' }, { text: 'Seats for your whole cohort' }, { text: 'Shared progress dashboard', soon: true }, { text: 'Custom subjects and question sets', soon: true }, { text: 'Invoice billing and priority support' }] },
];

export default function PricingSection({ heading = true }: { heading?: boolean }) {
  const [yearly, setYearly] = useState(true);
  const openAuth = useUi((s) => s.openAuth);

  return (
    <section id="pricing" className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
      {heading && (
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Start free. Pay when you need more practice.</h2>
          <p className="mt-4 text-lg text-muted">The docs and question bank are always free. Plans add more AI mock interviews and deeper feedback.</p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <span className={yearly ? 'text-muted' : 'font-medium'}>Monthly</span>
        <button role="switch" aria-checked={yearly} aria-label="Bill yearly" onClick={() => setYearly((y) => !y)}
          className={`relative h-6 w-11 rounded-full transition ${yearly ? 'bg-brand' : 'bg-line'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${yearly ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
        <span className={yearly ? 'font-medium' : 'text-muted'}>Yearly <span className="ml-1 rounded bg-hi/30 px-1.5 py-0.5 text-xs font-semibold text-ink">Save 20%</span></span>
      </div>

      <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = yearly ? p.yearly : p.monthly;
          return (
            <div key={p.id} className={`card relative flex flex-col p-7 ${p.featured ? 'border-brand ring-1 ring-brand' : ''}`}>
              {p.featured && <span className="absolute -top-3 left-7 rounded-md bg-brand px-2.5 py-0.5 text-xs font-semibold text-on-brand">Most popular</span>}
              <h3 className="text-2xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted">{p.blurb}</p>
              <div className="mt-6 flex items-end gap-1">
                {price === null ? <span className="font-display text-4xl font-semibold">Custom</span> : (
                  <><span className="font-display text-5xl font-semibold leading-none">${price}</span><span className="pb-1 text-sm text-muted">/ month</span></>
                )}
              </div>
              <p className="mt-1 h-5 text-xs text-muted">{price ? (yearly ? 'Billed yearly' : 'Billed monthly') : price === 0 ? 'Free forever' : 'From 10 seats'}</p>

              {p.id === 'starter'
                ? <button onClick={() => openAuth('register')} className="btn-ghost mt-6 w-full py-2.5">{p.cta}</button>
                : <Link href={`/contact?topic=${p.id}`} className={`${p.featured ? 'btn-primary' : 'btn-ghost'} mt-6 w-full py-2.5`}>{p.cta}</Link>}

              <ul className="mt-7 space-y-3 border-t border-line pt-6 text-sm">
                {p.features.map((f) => (
                  <li key={f.text} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-brand" /><span>{f.text}{f.soon && <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">Soon</span>}</span></li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted">Paid plans are opening soon. Early access members keep launch pricing. Everything in Starter works today.</p>
    </section>
  );
}

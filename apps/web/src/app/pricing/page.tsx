import type { Metadata } from 'next';
import Header from '@/components/Header';
import PricingSection from '@/components/PricingSection';
import { CtaBand, Faq } from '@/components/landing/Sections';

export const metadata: Metadata = { title: 'Pricing' };

const ROWS = [
  ['AI mock interviews per month', '2', '20', 'Custom'],
  ['Longest session', '15 min', '45 min', '45 min'],
  ['Interviewer personas', '3', 'All 10', 'All 10'],
  ['Scored report', 'Overall and 3 criteria', 'Plus per-question feedback', 'Plus per-question feedback'],
  ['Study plan and history', 'Last 3 reports', 'Unlimited', 'Unlimited'],
  ['Documentation and question bank', 'Included', 'Included', 'Included'],
  ['Seats', '1', '1', '10 or more'],
];

const PRICING_FAQ = [
  ['Can I switch plans later?', 'Yes. You can move up or down at any time and the change applies from your next billing date.'],
  ['What happens to my reports if I downgrade?', 'Your reports stay saved. Starter shows the three most recent ones and the rest return if you upgrade again.'],
  ['Do you offer student or bootcamp pricing?', 'Yes. Talk to us about the Teams plan and we will set up a cohort that fits your budget.'],
  ['Which payment methods will you accept?', 'Major credit and debit cards at launch, with invoice billing for Teams.'],
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <PricingSection />
        <section className="mx-auto max-w-[1000px] px-4 pb-4 sm:px-6">
          <h2 className="text-2xl font-semibold">Compare plans</h2>
          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-line bg-subtle"><th className="p-4 font-semibold">Feature</th><th className="p-4 font-semibold">Starter</th><th className="p-4 font-semibold text-brand">Pro</th><th className="p-4 font-semibold">Teams</th></tr></thead>
              <tbody>{ROWS.map((r) => <tr key={r[0]} className="border-b border-line last:border-0">{r.map((c, i) => <td key={i} className={`p-4 ${i === 0 ? 'font-medium' : 'text-muted'}`}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>
        <Faq items={PRICING_FAQ} />
        <CtaBand />
      </main>
    </>
  );
}

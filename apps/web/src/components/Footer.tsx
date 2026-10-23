'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/lib/site';
import Logo from './Logo';

const COLS = [
  { title: 'Product', links: [['Documentation', '/learn'], ['Question bank', '/practice'], ['Mock interviews', '/schedule'], ['Reports', '/reports'], ['Pricing', '/pricing']] },
  { title: 'Technologies', links: [['MERN stack', '/learn/mern-stack'], ['Docker', '/learn/docker'], ['DevOps & Cloud', '/learn/devops-cloud'], ['Python', '/learn/python'], ['Data structures', '/learn/dsa']] },
  { title: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/interview/')) return null; // keep the interview room distraction free
  return (
    <footer className="mt-24 border-t border-line bg-subtle/60">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{SITE.description}</p>
          <p className="mt-4 text-sm text-muted">Questions? <a className="link" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="font-sans text-sm font-semibold">{c.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([label, href]) => <li key={href}><Link href={href} className="text-muted transition hover:text-ink">{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:px-6">
          <span>© {SITE.year} {SITE.name}. All rights reserved.</span>
          <span>Interview feedback is guidance to help you practice. It is not a hiring decision.</span>
        </div>
      </div>
    </footer>
  );
}

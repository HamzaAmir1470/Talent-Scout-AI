'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BookOpen, CalendarClock, LayoutDashboard, Mic, ScrollText, Users } from 'lucide-react';
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarClock },
  { href: '/admin/interviews', label: 'Interviews', icon: Mic },
  { href: '/admin/content', label: 'Content', icon: BookOpen },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

export default function AdminShell({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <Header />
      <main>
        <RequireAuth admin reason="open the admin area">
          <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
              <nav aria-label="Admin" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-24 lg:mx-0 lg:block lg:self-start lg:space-y-1 lg:px-0">
                <p className="eyebrow mb-3 hidden px-3 lg:flex lg:items-center lg:gap-2"><Activity size={13} /> Admin</p>
                {NAV.map(({ href, label, icon: Icon, exact }) => {
                  const on = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link key={href} href={href} aria-current={on ? 'page' : undefined}
                      className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${on ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-subtle hover:text-ink'}`}><Icon size={16} />{label}</Link>
                  );
                })}
              </nav>
              <section className="min-w-0">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">{title}</h1>{actions}</div>
                {children}
              </section>
            </div>
          </div>
        </RequireAuth>
      </main>
    </>
  );
}

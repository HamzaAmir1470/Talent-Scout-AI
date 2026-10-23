'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, Search, Shield, X } from 'lucide-react';
import { signOut } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useUi } from '@/store/ui';
import AuthModal from './AuthModal';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '/learn', label: 'Docs', match: ['/learn'] },
  { href: '/practice', label: 'Practice', match: ['/practice'] },
  { href: '/schedule', label: 'Mock interviews', match: ['/schedule', '/interview'] },
  { href: '/reports', label: 'Reports', match: ['/reports'] },
  { href: '/pricing', label: 'Pricing', match: ['/pricing'] },
];
const ADMIN = { href: '/admin', label: 'Admin', match: ['/admin'] };

export default function Header() {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const logout = async () => { await signOut(); router.push('/'); };
  const { authMode, openAuth, closeAuth, setSearchOpen } = useUi();
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="Talent Scout AI home"><Logo /></Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {(ready && user?.role === 'admin' ? [...NAV, ADMIN] : NAV).map(({ href, label, match }) => {
              const active = match.some((m) => pathname.startsWith(m));
              return (
                <Link key={href} href={href} className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                  {label}
                  {active && <span className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded bg-brand" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="hidden h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition hover:bg-subtle sm:flex" aria-label="Search docs">
              <Search size={14} /> Search docs <kbd className="ml-4 rounded border border-line px-1.5 text-[11px]">Ctrl K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink2 sm:hidden" aria-label="Search docs"><Search size={16} /></button>
            <ThemeToggle />
            {ready && (user ? (
              <>
                <span className="hidden items-center gap-1.5 text-sm text-muted md:flex">{user.role === 'admin' && <Shield size={13} className="text-brand" />}{user.name}</span>
                <button className="btn-ghost hidden items-center gap-2 sm:flex" onClick={logout}><LogOut size={14} /> Log out</button>
              </>
            ) : (
              <>
                <button className="btn-ghost hidden sm:inline-flex" onClick={() => openAuth('login')}>Log in</button>
                <button className="btn-primary" onClick={() => openAuth('register')}>Get started</button>
              </>
            ))}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
              {menu ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="border-t border-line bg-canvas px-4 py-3 lg:hidden" aria-label="Mobile">
            {(ready && user?.role === 'admin' ? [...NAV, ADMIN] : NAV).map(({ href, label }) => <Link key={href} href={href} className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-subtle">{label}</Link>)}
            {ready && user && <button className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-subtle" onClick={logout}>Log out</button>}
          </nav>
        )}
      </header>
      {authMode && !user && <AuthModal mode={authMode} onModeChange={openAuth} onClose={closeAuth} />}
    </>
  );
}

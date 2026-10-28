import type { Metadata } from 'next';
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import 'highlight.js/styles/github-dark.css';
import './globals.css';
import AuthBootstrap from '@/components/AuthBootstrap';
import Footer from '@/components/Footer';
import ProgressSync from '@/components/ProgressSync';
import SearchPalette from '@/components/SearchPalette';
import Toaster from '@/components/Toaster';
import { SITE } from '@/lib/site';

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', style: ['normal', 'italic'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

// Runs before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('tsa-theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className={`${sans.variable} ${display.variable} ${mono.variable}`}>
        <AuthBootstrap />
        <ProgressSync />
        {children}
        <Footer />
        <SearchPalette />
        <Toaster />
      </body>
    </html>
  );
}

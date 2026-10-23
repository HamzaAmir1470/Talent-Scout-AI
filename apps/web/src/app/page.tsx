'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Dashboard from '@/components/Dashboard';
import PricingSection from '@/components/PricingSection';
import { CtaBand, Faq, Features, HowItWorks, ReportPreview, Stats, Technologies } from '@/components/landing/Sections';
import { useAuth } from '@/store/auth';

export default function Home() {
  const user = useAuth((s) => s.user);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <>
      <Header />
      <main>
        {ready && user ? <Dashboard /> : (
          <>
            <Hero />
            <Stats />
            <HowItWorks />
            <Features />
            <Technologies />
            <ReportPreview />
            <PricingSection />
            <Faq />
            <CtaBand />
          </>
        )}
      </main>
    </>
  );
}

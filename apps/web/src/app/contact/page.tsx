'use client';
import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import InfoPage from '@/components/InfoPage';
import { SITE } from '@/lib/site';

const TOPICS = [['support', 'Help with my account'], ['pro', 'Pro early access'], ['teams', 'Teams and bootcamps'], ['feedback', 'Product feedback'], ['privacy', 'Delete my data']];

export default function Contact() {
  const [topic, setTopic] = useState('support');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('topic');
    if (t && TOPICS.some(([k]) => k === t)) setTopic(t);
  }, []);
  const label = TOPICS.find(([k]) => k === topic)?.[1] ?? 'Hello';
  const href = `mailto:${SITE.email}?subject=${encodeURIComponent(`${SITE.name}: ${label}`)}&body=${encodeURIComponent(message)}`;

  return (
    <InfoPage eyebrow="Contact" title="Talk to a person" intro="Tell us what you need and we will reply by email, usually within one business day.">
      <div className="not-prose card p-6">
        <label className="eyebrow block">Topic</label>
        <select className="input mt-2" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="eyebrow mt-5 block">Message</label>
        <textarea className="input mt-2 min-h-[140px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
        <a href={href} className="btn-primary mt-5 inline-flex items-center gap-2"><Mail size={15} /> Open in your email app</a>
        <p className="mt-3 text-sm text-muted">Or write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> directly.</p>
      </div>
    </InfoPage>
  );
}

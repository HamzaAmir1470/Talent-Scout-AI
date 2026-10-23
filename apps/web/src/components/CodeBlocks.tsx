'use client';
import { useState } from 'react';
import { Check, Copy, TerminalSquare } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch { /* clipboard blocked */ }
  }
  return (
    <button onClick={copy} aria-label="Copy code" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#9aa39f] transition hover:bg-white/10 hover:text-white">
      {done ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CodeBlock({ lang, text, children }: { lang: string; text: string; children: React.ReactNode }) {
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="lang-chip">{lang}</span>
        <CopyButton text={text} />
      </div>
      <pre><code className={`hljs language-${lang}`}>{children}</code></pre>
    </div>
  );
}

type Line = { kind: 'cmd' | 'cont' | 'comment' | 'out'; text: string };

function parseTerminal(text: string): Line[] {
  const out: Line[] = [];
  let cont = false;
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) { cont = false; continue; }
    if (line.startsWith('#')) { out.push({ kind: 'comment', text: line }); continue; }
    if (line.startsWith('>>')) { out.push({ kind: 'out', text: line.slice(2).trimStart() }); continue; }
    out.push({ kind: cont ? 'cont' : 'cmd', text: line.replace(/^\$\s*/, '') });
    cont = line.endsWith('\\');
  }
  return out;
}

export function TerminalBlock({ text }: { text: string }) {
  const lines = parseTerminal(text);
  const commands = lines.filter((l) => l.kind === 'cmd' || l.kind === 'cont').map((l) => l.text).join('\n');
  return (
    <div className="terminal">
      <div className="term-head" style={{ background: '#0f1a16', borderColor: '#1f3a31' }}>
        <span className="flex items-center gap-2 text-xs text-emerald-300/80"><TerminalSquare size={14} /> Terminal</span>
        <CopyButton text={commands} />
      </div>
      <pre>
        {lines.map((l, i) => (
          <div key={i} className="term-line">
            {l.kind === 'cmd' && <span className="term-prompt">$</span>}
            {l.kind === 'cont' && <span className="term-prompt opacity-0">$</span>}
            <span style={{ color: l.kind === 'comment' ? '#6b7a74' : l.kind === 'out' ? '#9aa39f' : '#d1fae5' }}>{l.text}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

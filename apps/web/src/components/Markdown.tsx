'use client';
import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { common } from 'lowlight';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import nginx from 'highlight.js/lib/languages/nginx';
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { slugify } from '@/lib/slug';
import { CodeBlock, TerminalBlock } from './CodeBlocks';

const TERMINAL = new Set(['bash', 'sh', 'shell', 'console', 'terminal', 'zsh']);
const languages = { ...common, dockerfile, nginx, hcl: common.plaintext ?? (() => ({ name: 'hcl', contains: [] })) } as any;

function nodeText(n: React.ReactNode): string {
  if (typeof n === 'string' || typeof n === 'number') return String(n);
  if (Array.isArray(n)) return n.map(nodeText).join('');
  if (React.isValidElement(n)) return nodeText((n.props as { children?: React.ReactNode }).children);
  return '';
}

const heading = (Tag: 'h2' | 'h3'): Components['h2'] => ({ children }) => {
  const id = slugify(nodeText(children));
  return <Tag id={id}>{children}<a className="anchor" href={`#${id}`} aria-label="Link to this section">#</a></Tag>;
};

const CALLOUT = {
  tip: { icon: Lightbulb, cls: 'text-good' },
  note: { icon: Info, cls: 'text-brand' },
  warning: { icon: AlertTriangle, cls: 'text-warn' },
};

const components: Components = {
  pre: ({ children }) => <>{children}</>,
  h2: heading('h2'),
  h3: heading('h3'),
  code({ node, className, children }) {
    void node;
    const match = /language-([\w-]+)/.exec(className ?? '');
    const text = nodeText(children).replace(/\n$/, '');
    if (!match && !text.includes('\n')) return <code className="inline-code">{children}</code>;
    const lang = match?.[1] ?? 'text';
    if (TERMINAL.has(lang)) return <TerminalBlock text={text} />;
    return <CodeBlock lang={lang} text={text}>{children}</CodeBlock>;
  },
  blockquote({ children }) {
    const m = /^(tip|note|warning)\b/i.exec(nodeText(children).trim());
    const kind = (m ? m[1].toLowerCase() : 'note') as keyof typeof CALLOUT;
    const { icon: Icon, cls } = CALLOUT[kind];
    return <div className={`callout callout-${kind}`}><Icon size={18} className={`mt-1 shrink-0 ${cls}`} /><div>{children}</div></div>;
  },
  table: ({ children }) => <div className="table-wrap"><table>{children}</table></div>,
  a: ({ href, children }) => <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{children}</a>,
};

export default function Markdown({ children, compact = false }: { children: string; compact?: boolean }) {
  return (
    <div className={compact ? 'md md-sm' : 'md'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { languages, detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function fence(lang: string, code: string) {
  return '~~~' + lang + '\n' + code + '\n~~~';
}

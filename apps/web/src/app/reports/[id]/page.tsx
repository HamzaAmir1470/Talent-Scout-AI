'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';
import ReportView from '@/components/ReportView';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';
import type { SessionDetail } from '@/lib/types';

const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' });

function Content({ id }: { id: string }) {
  const { data, error, loading } = useApi<SessionDetail>(`/interviews/${id}`);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <Link href="/reports" className="text-sm text-slate-400 hover:text-white">All reports</Link>
      {loading && <div className="mt-6 space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>}
      {error && <div className="mt-6"><ErrorBox message={error} /></div>}
      {data && (
        <>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{data.subjectName} <span className="text-gradient">report</span></h1>
          <p className="mt-2 text-slate-400">{data.candidateRole} · {data.level}{data.endedAt ? ` · ${DATE.format(new Date(data.endedAt))}` : ''}</p>
          <div className="mt-8">
            {data.report ? <ReportView report={data.report} subject={data.subject} subjectName={data.subjectName} role={data.candidateRole} />
              : <div className="glass p-8 text-center text-slate-400">This report is not ready yet.</div>}
          </div>
          <section className="glass mt-6 print:hidden">
            <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-6 py-4 font-semibold">
              Full transcript ({data.messages.length} messages) <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="space-y-3 border-t border-white/10 p-6">
                {data.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : ''}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'candidate' ? 'bg-indigo-500/30' : 'bg-white/[0.07]'}`}>{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  return (<><Header /><main><RequireAuth reason="view this report"><Content id={id} /></RequireAuth></main></>);
}

'use client';
import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Badge, Modal, Pager, type Tone, when } from '@/components/admin/ui';
import ReportView, { scoreColor } from '@/components/ReportView';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';
import type { SessionDetail } from '@/lib/types';

interface Row { id: string; user: { name: string; email: string } | null; subjectName: string; candidateRole: string; level: string; status: string; mode: string; startedAt: string; durationSec?: number; overall: number | null; tokens: number }
const TONE: Record<string, Tone> = { active: 'brand', finishing: 'warn', completed: 'good' };

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, error, loading } = useApi<SessionDetail & { userId: string }>(`/admin/sessions/${id}`);
  return (
    <Modal title="Interview detail" onClose={onClose} wide>
      {loading && <Skeleton className="h-64" />}
      {error && <ErrorBox message={error} />}
      {data && (
        <div className="space-y-6">
          <p className="text-sm text-muted">{data.subjectName} · {data.candidateRole} · {data.level} · {when(data.startedAt)}</p>
          {data.report ? <ReportView report={data.report} subject={data.subject} subjectName={data.subjectName} role={data.candidateRole} /> : <p className="text-sm text-muted">No report yet. The session is {data.status}.</p>}
          <div><h3 className="mb-3 font-sans text-sm font-semibold">Transcript ({data.messages.length} messages)</h3>
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-line p-4">
              {data.messages.map((m, i) => <p key={i} className="text-sm"><b className={m.role === 'candidate' ? 'text-brand' : 'text-muted'}>{m.role === 'candidate' ? 'Candidate' : 'Interviewer'}:</b> {m.text}</p>)}
            </div></div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminInterviews() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<{ items: Row[]; total: number; page: number; limit: number }>(`/admin/sessions?page=${page}&limit=20`);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <AdminShell title="Interviews">
      {error && <ErrorBox message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="border-b border-line bg-subtle text-xs text-muted">{['Candidate', 'Interview', 'Started', 'Status', 'Score', 'Tokens', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3"><div className="font-medium">{s.user?.name ?? 'Deleted user'}</div><div className="text-xs text-muted">{s.user?.email}</div></td>
                    <td className="px-4 py-3">{s.subjectName}<div className="text-xs text-muted">{s.candidateRole} · {s.level}</div></td>
                    <td className="px-4 py-3 text-xs">{when(s.startedAt)}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[s.status] ?? 'muted'}>{s.status}</Badge> {s.mode === 'demo' && <Badge tone="warn">demo</Badge>}</td>
                    <td className={`px-4 py-3 font-semibold ${s.overall != null ? scoreColor(s.overall) : 'text-muted'}`}>{s.overall ?? '-'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{s.tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right"><button className="btn-ghost px-3 py-1.5" onClick={() => setOpen(s.id)}>View</button></td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No interviews yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
      {open && <Detail id={open} onClose={() => setOpen(null)} />}
    </AdminShell>
  );
}

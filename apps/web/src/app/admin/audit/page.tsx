'use client';
import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Badge, Pager, type Tone, when } from '@/components/admin/ui';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { useApi } from '@/lib/useApi';

interface Row { id: string; at: string; actorEmail?: string; action: string; target?: string; meta?: Record<string, unknown>; ip?: string }
const FILTERS = [['', 'All'], ['login', 'Sign-ins'], ['admin', 'Admin actions'], ['user', 'Accounts'], ['password', 'Passwords'], ['refresh', 'Sessions']];
const tone = (a: string): Tone => (a.includes('failed') || a.includes('locked') || a.includes('reuse') || a.includes('delete') ? 'bad' : a.startsWith('admin') ? 'brand' : a.includes('success') ? 'good' : 'muted');

export default function AdminAudit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<{ items: Row[]; total: number; page: number; limit: number }>(`/admin/audit?page=${page}&limit=30${action ? `&action=${action}` : ''}`);
  return (
    <AdminShell title="Audit log">
      <p className="mb-4 text-sm text-muted">Security events and every administrator action. Entries are kept for 180 days.</p>
      <div className="mb-4 flex flex-wrap gap-2">{FILTERS.map(([k, l]) => <button key={k} onClick={() => { setAction(k); setPage(1); }} className={`chip px-3 py-1.5 ${action === k ? 'chip-active' : 'hover:bg-subtle'}`}>{l}</button>)}</div>
      {error && <ErrorBox message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-line bg-subtle text-xs text-muted">{['When', 'Who', 'Event', 'Target', 'IP'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{when(l.at)}</td>
                    <td className="px-4 py-3">{l.actorEmail ?? <span className="text-muted">anonymous</span>}</td>
                    <td className="px-4 py-3"><Badge tone={tone(l.action)}>{l.action}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted">{l.target ?? ''}{l.meta ? ` ${JSON.stringify(l.meta)}` : ''}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{l.ip}</td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No events.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
    </AdminShell>
  );
}

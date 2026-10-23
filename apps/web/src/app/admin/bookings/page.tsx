'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { Badge, Confirm, Pager, type Tone, when } from '@/components/admin/ui';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { toast } from '@/store/toast';
import type { Booking } from '@/lib/types';

type Row = Booking & { user: { name: string; email: string } | null };
const TONE: Record<string, Tone> = { scheduled: 'brand', in_progress: 'good', completed: 'good', cancelled: 'muted', missed: 'bad' };

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi<{ items: Row[]; total: number; page: number; limit: number }>(`/admin/bookings?page=${page}&limit=20${status ? `&status=${status}` : ''}`);
  const [target, setTarget] = useState<Row | null>(null);

  return (
    <AdminShell title="Bookings">
      <div className="mb-4"><select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
        <option value="">All statuses</option>{['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
      {error && <ErrorBox message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead><tr className="border-b border-line bg-subtle text-xs text-muted">{['Candidate', 'Technology', 'Role and level', 'When', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((b) => (
                  <tr key={b.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3"><div className="font-medium">{b.user?.name ?? 'Deleted user'}</div><div className="text-xs text-muted">{b.user?.email}</div></td>
                    <td className="px-4 py-3">{b.subjectName}</td>
                    <td className="px-4 py-3 text-xs text-muted">{b.candidateRole}<br />{b.level} · {b.durationMin} min</td>
                    <td className="px-4 py-3 text-xs">{when(b.scheduledAt)}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[b.status]}>{b.status.replace('_', ' ')}</Badge></td>
                    <td className="px-4 py-3 text-right">{['scheduled', 'in_progress'].includes(b.status) && <button className="btn-ghost gap-1.5 px-3 py-1.5 text-bad" onClick={() => setTarget(b)}><X size={13} /> Cancel</button>}</td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No bookings.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
      {target && <Confirm title="Cancel this booking" danger confirmLabel="Cancel booking" body={<>{target.user?.name}&apos;s {target.subjectName} interview on {when(target.scheduledAt)} will be cancelled.</>}
        onClose={() => setTarget(null)} onConfirm={async () => { try { await api.patch(`/admin/bookings/${target.id}/cancel`); toast.success('Booking cancelled'); setTarget(null); reload(); } catch (e) { toast.error(errorMessage(e)); } }} />}
    </AdminShell>
  );
}

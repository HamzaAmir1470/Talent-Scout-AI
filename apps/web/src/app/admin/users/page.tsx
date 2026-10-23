'use client';
import { useState } from 'react';
import { Search, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX, LogOut } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { Badge, Confirm, Pager, useDebounced, when } from '@/components/admin/ui';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';

interface U { id: string; name: string; email: string; phone: string; role: 'user' | 'admin'; status: 'active' | 'suspended'; createdAt: string; lastLoginAt: string | null }
interface Res { items: U[]; total: number; page: number; limit: number }
type Action = { kind: 'role' | 'status' | 'revoke' | 'delete'; user: U };

export default function AdminUsers() {
  const me = useAuth((s) => s.user);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const qs = new URLSearchParams({ page: String(page), limit: '20', ...(q && { search: q }), ...(role && { role }), ...(status && { status }) });
  const { data, error, loading, reload } = useApi<Res>(`/admin/users?${qs}`);
  const [action, setAction] = useState<Action | null>(null);

  async function run() {
    if (!action) return;
    const { kind, user } = action;
    try {
      if (kind === 'role') await api.patch(`/admin/users/${user.id}`, { role: user.role === 'admin' ? 'user' : 'admin' });
      if (kind === 'status') await api.patch(`/admin/users/${user.id}`, { status: user.status === 'active' ? 'suspended' : 'active' });
      if (kind === 'revoke') await api.post(`/admin/users/${user.id}/revoke-sessions`);
      if (kind === 'delete') await api.delete(`/admin/users/${user.id}`);
      toast.success('Done');
      setAction(null);
      reload();
    } catch (e) { toast.error(errorMessage(e)); }
  }
  const copy = (a: Action) => {
    const n = a.user.name;
    if (a.kind === 'role') return { title: a.user.role === 'admin' ? 'Remove admin access' : 'Make admin', body: <>{a.user.role === 'admin' ? `${n} will lose access to the admin area.` : `${n} will be able to manage users, content and settings.`} They are signed out so the change applies immediately.</>, label: 'Confirm' };
    if (a.kind === 'status') return { title: a.user.status === 'active' ? 'Suspend account' : 'Reactivate account', body: <>{a.user.status === 'active' ? `${n} will be signed out and unable to log in.` : `${n} will be able to log in again.`}</>, label: a.user.status === 'active' ? 'Suspend' : 'Reactivate' };
    if (a.kind === 'revoke') return { title: 'Sign out everywhere', body: <>All of {n}&apos;s active sessions end now.</>, label: 'Sign out' };
    return { title: 'Delete account and data', body: <>This permanently deletes {n}&apos;s account, bookings, interview transcripts and reports. It cannot be undone.</>, label: 'Delete permanently' };
  };

  return (
    <AdminShell title="Users">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" /><input className="input pl-9" placeholder="Search name, email or phone" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search users" /></div>
        <select className="input w-auto" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Role"><option value="">All roles</option><option value="user">Users</option><option value="admin">Admins</option></select>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      {error && <ErrorBox message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead><tr className="border-b border-line bg-subtle text-xs text-muted">{['User', 'Phone', 'Role', 'Status', 'Last login', 'Joined', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3"><div className="font-medium">{u.name}</div><div className="text-xs text-muted">{u.email}</div></td>
                    <td className="px-4 py-3 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-3"><Badge tone={u.role === 'admin' ? 'brand' : 'muted'}>{u.role}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={u.status === 'active' ? 'good' : 'bad'}>{u.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted">{when(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-xs text-muted">{when(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.id === me?.id ? <span className="text-xs text-muted">You</span> : (
                        <div className="flex justify-end gap-1">
                          <button title={u.role === 'admin' ? 'Remove admin' : 'Make admin'} aria-label="Change role" className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink" onClick={() => setAction({ kind: 'role', user: u })}>{u.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}</button>
                          <button title={u.status === 'active' ? 'Suspend' : 'Reactivate'} aria-label="Change status" className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink" onClick={() => setAction({ kind: 'status', user: u })}>{u.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                          <button title="Sign out everywhere" aria-label="Sign out everywhere" className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink" onClick={() => setAction({ kind: 'revoke', user: u })}><LogOut size={15} /></button>
                          <button title="Delete" aria-label="Delete user" className="rounded-md p-2 text-bad hover:bg-bad/10" onClick={() => setAction({ kind: 'delete', user: u })}><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No users match.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
      {action && (() => { const c = copy(action); return <Confirm title={c.title} body={c.body} confirmLabel={c.label} danger={action.kind === 'delete' || (action.kind === 'status' && action.user.status === 'active')} requirePhrase={action.kind === 'delete' ? action.user.email : undefined} onConfirm={run} onClose={() => setAction(null)} />; })()}
    </AdminShell>
  );
}

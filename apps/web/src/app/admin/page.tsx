'use client';
import { useState } from 'react';
import { Activity, Cpu, Mic, RefreshCw, Users } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { Badge, BarChart, StatCard } from '@/components/admin/ui';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { toast } from '@/store/toast';

interface Overview {
  users: { total: number; admins: number; suspended: number; new7: number; new30: number; activeSessions: number; signups: { date: string; count: number }[] };
  bookings: { total: number; byStatus: Record<string, number>; next24h: number; bookedToday: number };
  interviews: { mode: string; total: number; completed: number; active: number; completionRate: number; avgOverall: number; avgAccuracy: number; avgDepth: number; avgCommunication: number; inputTokens: number; outputTokens: number; perDay: { date: string; count: number }[]; bySubject: { name: string; count: number; avg: number }[] };
  content: { subjects: number; topics: number; questions: number; editedTopics: number };
  health: Record<string, string>;
}
const nf = new Intl.NumberFormat();

export default function AdminOverview() {
  const { data, error, loading, reload } = useApi<Overview>('/admin/overview');
  const [busy, setBusy] = useState(false);
  async function clear() {
    setBusy(true);
    try { await api.post('/admin/cache/clear'); toast.success('Cache cleared'); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  const d = data;
  return (
    <AdminShell title="Overview" actions={<div className="flex gap-2"><button className="btn-ghost gap-2" onClick={reload}><RefreshCw size={14} /> Refresh</button><button className="btn-ghost" disabled={busy} onClick={clear}>Clear cache</button></div>}>
      {error && <ErrorBox message={error} />}
      {loading && !d && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>}
      {d && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Users" value={nf.format(d.users.total)} hint={`${d.users.new7} new this week, ${d.users.new30} this month`} icon={<Users size={16} />} />
            <StatCard label="Signed in now" value={nf.format(d.users.activeSessions)} hint={`${d.users.suspended} suspended, ${d.users.admins} admins`} icon={<Activity size={16} />} />
            <StatCard label="Interviews" value={nf.format(d.interviews.total)} hint={`${d.interviews.completionRate}% completed, ${d.interviews.active} live`} icon={<Mic size={16} />} />
            <StatCard label="Average score" value={d.interviews.avgOverall || '-'} hint={`Accuracy ${d.interviews.avgAccuracy}, depth ${d.interviews.avgDepth}, communication ${d.interviews.avgCommunication}`} />
            <StatCard label="Booked next 24 hours" value={d.bookings.next24h} hint={`${d.bookings.bookedToday} booked today, ${d.bookings.total} total`} />
            <StatCard label="Upcoming / missed" value={`${d.bookings.byStatus.scheduled ?? 0} / ${d.bookings.byStatus.missed ?? 0}`} hint={`${d.bookings.byStatus.cancelled ?? 0} cancelled, ${d.bookings.byStatus.completed ?? 0} completed`} />
            <StatCard label="Content" value={`${d.content.topics} pages`} hint={`${d.content.questions} questions, ${d.content.editedTopics} edited by admins`} />
            <StatCard label="AI tokens used" value={nf.format(d.interviews.inputTokens + d.interviews.outputTokens)} hint={`${nf.format(d.interviews.inputTokens)} in, ${nf.format(d.interviews.outputTokens)} out`} icon={<Cpu size={16} />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5"><h2 className="mb-4 font-sans text-sm font-semibold">Signups, last 14 days</h2><BarChart label="Signups per day" data={d.users.signups.map((s) => ({ label: s.date, value: s.count }))} /></div>
            <div className="card p-5"><h2 className="mb-4 font-sans text-sm font-semibold">Interviews started, last 14 days</h2><BarChart label="Interviews per day" data={d.interviews.perDay.map((s) => ({ label: s.date, value: s.count }))} /></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-4 font-sans text-sm font-semibold">System health</h2>
              <ul className="space-y-2.5 text-sm">
                {Object.entries(d.health).map(([k, v]) => <li key={k} className="flex items-center justify-between capitalize"><span>{k} service</span><Badge tone={v === 'up' ? 'good' : 'bad'}>{v}</Badge></li>)}
                <li className="flex items-center justify-between"><span>AI interviewer</span><Badge tone={d.interviews.mode === 'gemini' ? 'good' : 'warn'}>{d.interviews.mode === 'gemini' ? 'Gemini' : 'Demo mode'}</Badge></li>
              </ul>
              {d.interviews.mode === 'demo' && <p className="mt-4 rounded-lg bg-warn/10 p-3 text-xs text-warn">Demo mode is on because GEMINI_API_KEY is not set. Interviews use scripted questions.</p>}
            </div>
            <div className="card p-5">
              <h2 className="mb-4 font-sans text-sm font-semibold">Interviews by technology</h2>
              {d.interviews.bySubject.length === 0 ? <p className="text-sm text-muted">No interviews yet.</p> : (
                <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted"><th className="pb-2 font-medium">Technology</th><th className="pb-2 font-medium">Count</th><th className="pb-2 font-medium">Avg score</th></tr></thead>
                  <tbody>{d.interviews.bySubject.map((s) => <tr key={s.name} className="border-t border-line"><td className="py-2">{s.name}</td><td>{s.count}</td><td>{s.avg || '-'}</td></tr>)}</tbody></table>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

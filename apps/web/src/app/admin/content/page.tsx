'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { Badge, Modal } from '@/components/admin/ui';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { api, errorMessage } from '@/lib/api';
import { SubjectIcon } from '@/lib/icons';
import { useApi } from '@/lib/useApi';
import { toast } from '@/store/toast';

interface Sub { id: string; slug: string; name: string; icon: string; accent: string; group: string; description: string; adminEdited?: boolean }
interface Topic { id: string; subjectSlug: string; subjectName: string; title: string; section: string; minutes: number; order: number; adminEdited: boolean; questionCount: number }

function SubjectForm({ s, onClose, onSaved }: { s: Sub; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: s.name, description: s.description, accent: s.accent, group: s.group });
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try { await api.put(`/admin/content/subjects/${s.id}`, f); toast.success('Technology updated'); onSaved(); onClose(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title={`Edit ${s.name}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <label className="block font-medium">Name<input className="input mt-1.5 font-normal" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} /></label>
        <label className="block font-medium">Description<textarea className="input mt-1.5 min-h-[90px] font-normal" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={400} /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block font-medium">Group<input className="input mt-1.5 font-normal" value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} maxLength={60} /></label>
          <label className="block font-medium">Accent color<div className="mt-1.5 flex gap-2"><input type="color" value={f.accent} onChange={(e) => setF({ ...f, accent: e.target.value })} className="h-10 w-12 cursor-pointer rounded border border-line bg-surface p-1" aria-label="Pick color" /><input className="input font-mono font-normal" value={f.accent} onChange={(e) => setF({ ...f, accent: e.target.value })} maxLength={7} /></div></label>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy} onClick={save}>Save</button></div>
    </Modal>
  );
}

export default function AdminContent() {
  const { data, error, loading, reload } = useApi<{ subjects: Sub[]; topics: Topic[] }>('/admin/content/topics');
  const [filter, setFilter] = useState('');
  const [edit, setEdit] = useState<Sub | null>(null);
  const topics = useMemo(() => (data?.topics ?? []).filter((t) => !filter || t.subjectSlug === filter), [data, filter]);

  return (
    <AdminShell title="Content" actions={<Link href={`/admin/content/new${filter ? `?subject=${filter}` : ''}`} className="btn-primary gap-2"><Plus size={15} /> New page</Link>}>
      <p className="mb-6 max-w-2xl text-sm text-muted">Edit documentation pages and interview questions. Changes go live immediately. Pages you edit here are protected from being overwritten by the built-in library.</p>
      {error && <ErrorBox message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <>
          <h2 className="mb-3 font-sans text-sm font-semibold">Technologies</h2>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.subjects.map((s) => (
              <div key={s.id} className="card flex items-center gap-3 p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: s.accent, background: `color-mix(in srgb, ${s.accent} 14%, transparent)` }}><SubjectIcon name={s.icon} size={18} /></span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{s.name}</div><div className="text-xs text-muted">{s.group}</div></div>
                <button className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink" onClick={() => setEdit(s)} aria-label={`Edit ${s.name}`}><Pencil size={14} /></button>
              </div>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-sans text-sm font-semibold">Pages ({topics.length})</h2>
            <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Technology"><option value="">All technologies</option>{data.subjects.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="border-b border-line bg-subtle text-xs text-muted">{['Page', 'Technology', 'Section', 'Read', 'Questions', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{t.title} {t.adminEdited && <Badge tone="brand">edited</Badge>}</td>
                    <td className="px-4 py-3 text-muted">{t.subjectName}</td>
                    <td className="px-4 py-3 text-muted">{t.section}</td>
                    <td className="px-4 py-3 text-muted">{t.minutes} min</td>
                    <td className="px-4 py-3">{t.questionCount}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/admin/content/${t.id}`} className="btn-ghost gap-1.5 px-3 py-1.5"><Pencil size={13} /> Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {edit && <SubjectForm s={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </AdminShell>
  );
}

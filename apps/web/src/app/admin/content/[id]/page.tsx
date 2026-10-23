'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { Confirm, Modal } from '@/components/admin/ui';
import DifficultyBadge from '@/components/DifficultyBadge';
import Markdown from '@/components/Markdown';
import { ErrorBox, Skeleton } from '@/components/Skeleton';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { toast } from '@/store/toast';
import type { Difficulty, Subject } from '@/lib/types';

interface Q { id?: string; topicId?: string; difficulty: Difficulty; question: string; answer: string; codeSnippet?: string; codeLanguage?: string; devopsCommand?: string; keyTakeaway: string }
interface Detail { topic: { id: string; subjectSlug: string; title: string; summary: string; minutes: number; section: string; order: number }; markdown: string; questions: Required<Pick<Q, 'id'>> & Q[] | (Q & { id: string })[] }
const BLANK_Q: Q = { difficulty: 'beginner', question: '', answer: '', codeSnippet: '', codeLanguage: '', devopsCommand: '', keyTakeaway: '' };
const STARTER = '## Overview\n\nExplain the idea in two or three sentences.\n\n## Core concepts\n\n- First idea\n- Second idea\n\n## Example\n\n~~~javascript\nconsole.log("hello");\n~~~\n\n> **Tip:** Share a practical tip here.\n';

function QuestionForm({ topicId, q, onClose, onSaved }: { topicId: string; q: Q; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Q>(q);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Q) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function save() {
    setBusy(true);
    try {
      const body = { difficulty: f.difficulty, question: f.question, answer: f.answer, keyTakeaway: f.keyTakeaway, codeSnippet: f.codeSnippet || undefined, codeLanguage: f.codeLanguage || undefined, devopsCommand: f.devopsCommand || undefined };
      if (q.id) await api.put(`/admin/content/questions/${q.id}`, body); else await api.post('/admin/content/questions', { ...body, topicId });
      toast.success('Question saved'); onSaved(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal title={q.id ? 'Edit question' : 'Add question'} onClose={onClose} wide>
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <label className="font-medium">Level<select className="input mt-1.5 font-normal" value={f.difficulty} onChange={set('difficulty')}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="senior">Senior</option></select></label>
        <label className="font-medium">Key takeaway<input className="input mt-1.5 font-normal" value={f.keyTakeaway} onChange={set('keyTakeaway')} maxLength={300} /></label>
        <label className="font-medium md:col-span-2">Question<textarea className="input mt-1.5 min-h-[70px] font-normal" value={f.question} onChange={set('question')} maxLength={500} /></label>
        <label className="font-medium md:col-span-2">Answer (markdown allowed)<textarea className="input mt-1.5 min-h-[120px] font-normal" value={f.answer} onChange={set('answer')} maxLength={6000} /></label>
        <label className="font-medium md:col-span-2">Code example (optional)<textarea className="input mt-1.5 min-h-[90px] font-mono text-xs font-normal" value={f.codeSnippet} onChange={set('codeSnippet')} /></label>
        <label className="font-medium">Code language<input className="input mt-1.5 font-normal" value={f.codeLanguage} onChange={set('codeLanguage')} placeholder="javascript" maxLength={20} /></label>
        <label className="font-medium">Terminal commands (optional)<textarea className="input mt-1.5 min-h-[44px] font-mono text-xs font-normal" value={f.devopsCommand} onChange={set('devopsCommand')} /></label>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy || f.question.length < 5 || f.answer.length < 5 || f.keyTakeaway.length < 3} onClick={save}>Save question</button></div>
    </Modal>
  );
}

export default function TopicEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const detail = useApi<Detail>(isNew ? null : `/admin/content/topics/${id}`);
  const subjects = useApi<Subject[]>('/content/subjects');
  const [f, setF] = useState({ subjectSlug: '', title: '', summary: '', minutes: 5, section: 'General', order: 0, markdown: STARTER });
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [busy, setBusy] = useState(false);
  const [editQ, setEditQ] = useState<Q | null>(null);
  const [delQ, setDelQ] = useState<(Q & { id: string }) | null>(null);
  const [delTopic, setDelTopic] = useState(false);

  useEffect(() => {
    if (detail.data) { const t = detail.data.topic; setF({ subjectSlug: t.subjectSlug, title: t.title, summary: t.summary, minutes: t.minutes, section: t.section, order: t.order, markdown: detail.data.markdown }); }
  }, [detail.data]);
  useEffect(() => {
    const pre = new URLSearchParams(window.location.search).get('subject');
    if (isNew && pre) setF((x) => ({ ...x, subjectSlug: pre }));
  }, [isNew]);

  const questions = (detail.data?.questions ?? []) as (Q & { id: string })[];
  const valid = f.title.trim().length >= 2 && f.markdown.trim().length > 0 && (!isNew || f.subjectSlug);

  async function save() {
    setBusy(true);
    try {
      const body = { title: f.title, summary: f.summary, minutes: Number(f.minutes) || 5, section: f.section || 'General', order: Number(f.order) || 0, markdown: f.markdown, ...(isNew && { subjectSlug: f.subjectSlug }) };
      if (isNew) { const { data } = await api.post<{ id: string }>('/admin/content/topics', body); toast.success('Page created'); router.replace(`/admin/content/${data.id}`); }
      else { await api.put(`/admin/content/topics/${id}`, body); toast.success('Page saved and live'); detail.reload(); }
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <AdminShell title={isNew ? 'New page' : 'Edit page'} actions={
      <div className="flex gap-2">
        {!isNew && <Link href={`/learn/${f.subjectSlug}/${detail.data?.topic ? (detail.data.topic as any).slug : ''}`} target="_blank" className="btn-ghost gap-2"><ExternalLink size={14} /> View live</Link>}
        <button className="btn-primary gap-2" disabled={busy || !valid} onClick={save}><Save size={15} /> {isNew ? 'Create page' : 'Save changes'}</button>
      </div>}>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> All content</Link>
      {detail.error && <ErrorBox message={detail.error} />}
      {!isNew && detail.loading && !detail.data && <Skeleton className="h-96" />}
      {(isNew || detail.data) && (
        <div className="space-y-8">
          <div className="card grid gap-4 p-5 text-sm md:grid-cols-6">
            <label className="font-medium md:col-span-2">Technology
              <select className="input mt-1.5 font-normal" value={f.subjectSlug} disabled={!isNew} onChange={(e) => setF({ ...f, subjectSlug: e.target.value })}>
                <option value="">Choose...</option>{subjects.data?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></label>
            <label className="font-medium md:col-span-4">Title<input className="input mt-1.5 font-normal" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} /></label>
            <label className="font-medium md:col-span-6">Summary<input className="input mt-1.5 font-normal" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} maxLength={300} placeholder="One sentence shown under the title and in search" /></label>
            <label className="font-medium md:col-span-3">Sidebar section<input className="input mt-1.5 font-normal" value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} maxLength={60} /></label>
            <label className="font-medium md:col-span-2">Minutes to read<input type="number" min={1} max={90} className="input mt-1.5 font-normal" value={f.minutes} onChange={(e) => setF({ ...f, minutes: Number(e.target.value) })} /></label>
            <label className="font-medium">Order<input type="number" min={0} className="input mt-1.5 font-normal" value={f.order} onChange={(e) => setF({ ...f, order: Number(e.target.value) })} /></label>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold">Content (markdown)</h2>
              <div className="inline-flex rounded-lg border border-line bg-surface p-1 lg:hidden">{(['write', 'preview'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${view === v ? 'bg-ink text-canvas' : 'text-muted'}`}>{v}</button>)}</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={view === 'preview' ? 'hidden lg:block' : ''}>
                <textarea className="input min-h-[560px] font-mono text-[13px] leading-relaxed" value={f.markdown} onChange={(e) => setF({ ...f, markdown: e.target.value })} spellCheck aria-label="Markdown source" />
                <p className="mt-2 text-xs text-muted">Use ## for sections and ### for sub-sections. Fence code with ~~~language. Callouts: start a quote with <code>&gt; **Tip:**</code>, <code>**Note:**</code> or <code>**Warning:**</code>. Terminal blocks use ~~~bash.</p>
              </div>
              <div className={`card max-h-[640px] overflow-y-auto p-6 ${view === 'write' ? 'hidden lg:block' : ''}`}><Markdown>{f.markdown || '*Nothing to preview yet.*'}</Markdown></div>
            </div>
          </div>

          {!isNew && (
            <div>
              <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-sm font-semibold">Interview questions ({questions.length})</h2><button className="btn-ghost gap-2" onClick={() => setEditQ(BLANK_Q)}><Plus size={14} /> Add question</button></div>
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-start gap-3 p-4"><DifficultyBadge level={q.difficulty} /><p className="min-w-0 flex-1 text-sm">{q.question}</p>
                    <button className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink" aria-label="Edit question" onClick={() => setEditQ(q)}><Pencil size={14} /></button>
                    <button className="rounded-md p-2 text-bad hover:bg-bad/10" aria-label="Delete question" onClick={() => setDelQ(q)}><Trash2 size={14} /></button></div>
                ))}
                {questions.length === 0 && <p className="p-6 text-center text-sm text-muted">No questions yet. Every page should end with three or more.</p>}
              </div>
              <button className="mt-8 inline-flex items-center gap-2 text-sm text-bad hover:underline" onClick={() => setDelTopic(true)}><Trash2 size={14} /> Delete this page and its questions</button>
            </div>
          )}
        </div>
      )}
      {editQ && <QuestionForm topicId={id} q={editQ} onClose={() => setEditQ(null)} onSaved={detail.reload} />}
      {delQ && <Confirm title="Delete question" danger confirmLabel="Delete" body="This question is removed from the docs and the question bank." onClose={() => setDelQ(null)}
        onConfirm={async () => { try { await api.delete(`/admin/content/questions/${delQ.id}`); toast.success('Question deleted'); setDelQ(null); detail.reload(); } catch (e) { toast.error(errorMessage(e)); } }} />}
      {delTopic && <Confirm title="Delete page" danger confirmLabel="Delete page" requirePhrase="delete" body="The page, its guide and all its questions are removed permanently." onClose={() => setDelTopic(false)}
        onConfirm={async () => { try { await api.delete(`/admin/content/topics/${id}`); toast.success('Page deleted'); router.replace('/admin/content'); } catch (e) { toast.error(errorMessage(e)); } }} />}
    </AdminShell>
  );
}

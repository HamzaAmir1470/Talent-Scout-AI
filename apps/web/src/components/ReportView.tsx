'use client';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarPlus, CheckCircle2, Printer, Target, TrendingUp } from 'lucide-react';
import ProgressRing from './ProgressRing';
import type { Report } from '@/lib/types';

export const scoreColor = (n: number) => (n >= 80 ? 'text-emerald-300' : n >= 60 ? 'text-amber-300' : 'text-rose-300');
const barColor = (n: number) => (n >= 80 ? 'bg-good' : n >= 60 ? 'bg-warn' : 'bg-bad');

const VERDICT: Record<string, string> = {
  'Strong hire': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  Hire: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
  Borderline: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  'Needs more practice': 'border-rose-400/40 bg-rose-400/10 text-rose-300',
};

function Bar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-slate-300">{label}</span><b className={scoreColor(value)}>{value}</b></div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barColor(value)}`} style={{ width: `${value}%`, transition: `width 1s ${delay}ms cubic-bezier(.2,.7,.2,1)` }} />
      </div>
    </div>
  );
}

export default function ReportView({ report, subject, subjectName, role }: { report: Report; subject: string; subjectName: string; role?: string }) {
  return (
    <div className="space-y-6">
      <section className="glass rise flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        <div className="relative shrink-0">
          <ProgressRing value={report.overall / 100} size={150} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold ${scoreColor(report.overall)}`}>{report.overall}</span>
            <span className="eyebrow">overall</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${VERDICT[report.verdict] ?? VERDICT.Borderline}`}>{report.verdict}</span>
            <span className="chip">{subjectName}{role ? ` · ${role}` : ''}</span>
            {report.demo && <span className="chip text-amber-300">Demo scoring</span>}
          </div>
          <p className="mt-3 text-slate-200">{report.summary}</p>
          <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${report.interviewSkills !== undefined ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            <Bar label="Technical accuracy" value={report.technicalAccuracy} delay={100} />
            <Bar label="Depth" value={report.depth} delay={250} />
            <Bar label="Communication" value={report.communication} delay={400} />
            {report.interviewSkills !== undefined && <Bar label="Interview skills" value={report.interviewSkills} delay={550} />}
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass p-6">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={18} /> Strengths</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">{report.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-400">+</span>{s}</li>)}</ul>
        </section>
        <section className="glass p-6">
          <h3 className="flex items-center gap-2 font-semibold text-amber-300"><TrendingUp size={18} /> To improve</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">{report.improvements.map((s, i) => <li key={i} className="flex gap-2"><span className="text-amber-400">→</span>{s}</li>)}</ul>
        </section>
      </div>

      {report.introduction && report.behavioral && report.professionalism && (
        <section className="glass p-6">
          <h3 className="font-semibold text-white">Interview skills</h3>
          <p className="mt-1 text-sm text-muted">How you handled the parts of the interview that every employer uses.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {[['Tell me about yourself', report.introduction], ['Behavioral answers (STAR)', report.behavioral], ['Professionalism', report.professionalism]].map(([title, part]: any) => (
              <div key={title} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3"><span className="text-sm font-semibold">{title}</span><b className={`text-lg ${scoreColor(part.score)}`}>{part.score}</b></div>
                <p className="mt-2 text-sm text-muted">{part.feedback}</p>
                {part.missing?.length > 0 && <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">Missing: {part.missing.map((m: string) => <span key={m} className="rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 font-medium text-warn">{m}</span>)}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {report.questions.length > 0 && (
        <section className="glass p-6">
          <h3 className="font-semibold text-white">Question by question</h3>
          <div className="mt-4 divide-y divide-white/10">
            {report.questions.map((q, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-slate-100">{q.question}</p>
                  <span className={`shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-sm font-bold ${scoreColor(q.score)}`}>{q.score}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400"><span className="text-slate-500">You said: </span>{q.answerSummary}</p>
                <p className="mt-1.5 text-sm text-slate-300">{q.feedback}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass p-6">
        <h3 className="flex items-center gap-2 font-semibold text-indigo-300"><Target size={18} /> Your study plan</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300 marker:text-indigo-400">{report.studyPlan.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <Link href={`/learn/${subject}`} className="btn-ghost flex items-center gap-2"><BookOpen size={15} /> Study {subjectName}</Link>
          <Link href="/practice" className="btn-ghost flex items-center gap-2"><Target size={15} /> Practice questions</Link>
          <Link href="/schedule" className="btn-primary flex items-center gap-2"><CalendarPlus size={15} /> Book another <ArrowRight size={14} /></Link>
          <button onClick={() => window.print()} className="btn-ghost ml-auto flex items-center gap-2"><Printer size={15} /> Print / save PDF</button>
        </div>
      </section>
    </div>
  );
}

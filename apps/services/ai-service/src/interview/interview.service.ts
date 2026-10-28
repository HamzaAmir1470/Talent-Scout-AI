import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { firstValueFrom, timeout } from 'rxjs';
import { LlmService } from './llm.service';
import { PERSONAS, buildSystemPrompt, getPersona } from './personas';
import { DONE_MESSAGE, nextStage, openingMessage, Stage, stageGuide } from './stages';
import { InterviewSession, SessionDocument } from './schemas/session.schema';
import { ApiError, Msg } from './types';

@Injectable()
export class InterviewService {
  constructor(
    @InjectModel(InterviewSession.name) private readonly model: Model<SessionDocument>,
    @Inject('SCHEDULER_SERVICE') private readonly scheduler: ClientProxy,
    private readonly llm: LlmService,
    private readonly cfg: ConfigService,
  ) {}

  get demo() { return this.llm.demo; }

  private async rpc<T = any>(pattern: string, data: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.scheduler.send<T>(pattern, data).pipe(timeout(5000)));
    } catch (e: any) {
      throw new ApiError(e?.message ?? 'Scheduler is unavailable', 'scheduler');
    }
  }

  /** Validates the booking and opens (or resumes) the session. */
  async start(userId: string, bookingId: string) {
    const booking = await this.rpc('scheduler.getBooking', { id: bookingId, userId });
    if (booking.status === 'cancelled') throw new ApiError('This interview was cancelled', 'cancelled');
    if (booking.status === 'missed') throw new ApiError('This interview slot has passed. Please book a new one', 'missed');

    const existing = await this.model.findOne({ bookingId });
    if (existing && existing.status !== 'active') {
      throw new ApiError('This interview is already complete', 'completed', { sessionId: String(existing._id) });
    }
    if (existing) return { session: existing, booking, resumed: true };

    if (booking.status === 'completed') throw new ApiError('This interview is already complete', 'completed', { sessionId: booking.sessionId });
    if (!booking.joinable) {
      throw new ApiError('The room is not open yet', 'too_early', { opensAt: booking.joinOpensAt });
    }

    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const today = await this.model.countDocuments({ userId, startedAt: { $gte: dayStart } });
    if (today >= Number(this.cfg.get('MAX_SESSIONS_PER_DAY', 5))) {
      throw new ApiError('You reached the daily interview limit. Come back tomorrow', 'quota');
    }

    const now = new Date();
    const session = await this.model.create({
      userId, bookingId, subject: booking.subject, subjectName: booking.subjectName,
      candidateRole: booking.candidateRole, level: booking.level, candidateName: booking.candidateName, startedAt: now, stage: 'intro', stageAnswers: 0,
      endsAt: new Date(now.getTime() + booking.durationMin * 60_000),
      mode: this.llm.demo ? 'demo' : 'gemini',
    });
    await this.rpc('scheduler.updateStatus', { id: bookingId, status: 'in_progress', sessionId: String(session._id) });
    return { session, booking, resumed: false };
  }

  async addMessage(id: string, role: Msg['role'], text: string, usage?: { inputTokens: number; outputTokens: number }, stage?: string) {
    const update: any = { $push: { messages: { role, text, at: new Date(), stage } } };
    if (usage) update.$inc = { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens };
    await this.model.updateOne({ _id: id }, update);
  }

  async getSessionDoc(id: string) {
    return this.model.findById(id).lean();
  }

  /**
   * Produces the interviewer's next turn. The opening is a fixed professional welcome that ends with "Tell me about yourself".
   * After that the server advances the stage (follow-up, experience, technical, behavioral, questions, closing) and the model only
   * has to write the next question for that stage.
   */
  async interviewerTurn(sessionId: string, onDelta: (t: string) => void): Promise<{ text: string; stage: Stage }> {
    const s: any = await this.getSessionDoc(sessionId);
    if (!s) throw new ApiError('Session not found', 'not_found');
    const persona = getPersona(s.subject);
    const startMs = new Date(s.startedAt).getTime();
    const totalMs = Math.max(60_000, new Date(s.endsAt).getTime() - startMs);
    const f = (Date.now() - startMs) / totalMs;
    const subjectName = s.subjectName ?? s.subject;
    const durationMin = Math.round(totalMs / 60_000);
    let stage: Stage = (s.stage as Stage) ?? 'intro';
    let stageAnswers: number = s.stageAnswers ?? 0;
    let text: string;
    let usage = { inputTokens: 0, outputTokens: 0 };

    const speak = async (t: string) => { for (const w of t.split(' ')) { onDelta(w + ' '); await new Promise((r) => setTimeout(r, 18)); } return t; };

    if (s.messages.length === 0) {
      stage = 'intro'; stageAnswers = 0;
      text = await speak(openingMessage({ name: s.candidateName, persona, candidateRole: s.candidateRole, subjectName, durationMin }));
    } else {
      stageAnswers += 1; // the candidate just answered a question asked in `stage`
      const next = nextStage(stage, stageAnswers, f);
      if (next !== stage) { stage = next; stageAnswers = 0; }
      if (stage === 'done') {
        text = await speak(DONE_MESSAGE);
      } else {
        const techIndex = s.messages.filter((m: any) => m.role === 'candidate' && m.stage === 'technical').length + 1;
        const ctx = { minutesLeft: Math.max(0, Math.round((new Date(s.endsAt).getTime() - Date.now()) / 60_000)), techIndex, subjectName, candidateRole: s.candidateRole, level: s.level, persona };
        const system = buildSystemPrompt({ persona, candidateRole: s.candidateRole, level: s.level, durationMin, subjectName }) + stageGuide(stage, ctx);
        const res = await this.llm.interviewTurn({ system, history: s.messages, persona, stage, ctx, onDelta });
        text = res.text;
        usage = { inputTokens: res.inputTokens, outputTokens: res.outputTokens };
      }
    }
    await this.model.updateOne({ _id: sessionId }, {
      $set: { stage, stageAnswers },
      $push: { messages: { role: 'assistant', text, at: new Date(), stage } },
      $inc: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
    });
    return { text, stage };
  }

  /** Scores the interview. Safe to call twice: only one caller wins the claim. */
  async finish(sessionId: string, userId: string) {
    if (!isValidObjectId(sessionId)) throw new ApiError('Session not found', 'not_found');
    const s: any = await this.model.findOneAndUpdate({ _id: sessionId, userId, status: 'active' }, { status: 'finishing' }, { new: true });
    if (!s) {
      const done: any = await this.model.findOne({ _id: sessionId, userId }).lean();
      if (done?.status === 'completed') return { sessionId, report: done.report };
      throw new ApiError('The report is still being prepared. Try again in a moment', 'busy');
    }
    const answers = s.messages.filter((m: any) => m.role === 'candidate').length;
    if (answers === 0) {
      await this.model.deleteOne({ _id: sessionId });
      await this.rpc('scheduler.updateStatus', { id: s.bookingId, status: 'scheduled' }).catch(() => undefined);
      return { sessionId: null, empty: true };
    }
    try {
      const report = await this.llm.scoreSession({
        subjectName: s.subjectName ?? s.subject, candidateRole: s.candidateRole, level: s.level, messages: s.messages,
      });
      const endedAt = new Date();
      await this.model.updateOne({ _id: sessionId }, {
        status: 'completed', endedAt, report,
        durationSec: Math.round((endedAt.getTime() - new Date(s.startedAt).getTime()) / 1000),
      });
      await this.rpc('scheduler.updateStatus', { id: s.bookingId, status: 'completed', sessionId });
      return { sessionId, report };
    } catch (e) {
      await this.model.updateOne({ _id: sessionId }, { status: 'active' });
      throw new ApiError('We could not generate your report. Please try ending the session again', 'report_failed');
    }
  }

  // ---------------- read side ----------------
  private full(s: any) {
    return {
      id: String(s._id), bookingId: s.bookingId, subject: s.subject, subjectName: s.subjectName,
      candidateRole: s.candidateRole, level: s.level, status: s.status, mode: s.mode,
      startedAt: s.startedAt, endedAt: s.endedAt, durationSec: s.durationSec,
      messages: s.messages, report: s.report ?? null, stage: s.stage ?? 'intro',
    };
  }

  async getSession(id: string, userId: string) {
    const s = isValidObjectId(id) ? await this.model.findOne({ _id: id, userId }).lean() : null;
    if (!s) throw new ApiError('Session not found', 'not_found');
    return this.full(s);
  }

  async getByBooking(bookingId: string, userId: string) {
    const s = await this.model.findOne({ bookingId, userId }).lean();
    if (!s) throw new ApiError('Session not found', 'not_found');
    return this.full(s);
  }

  async list(userId: string, page = 1, limit = 20) {
    limit = Math.min(Math.max(limit, 1), 50);
    page = Math.max(page, 1);
    const filter = { userId, status: 'completed' };
    const [rows, total] = await Promise.all([
      this.model.find(filter).select('-messages').sort({ endedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return {
      total, page, limit,
      items: rows.map((s: any) => ({
        id: String(s._id), subject: s.subject, subjectName: s.subjectName, candidateRole: s.candidateRole,
        level: s.level, startedAt: s.startedAt, endedAt: s.endedAt, durationSec: s.durationSec, mode: s.mode,
        overall: s.report?.overall ?? 0, technicalAccuracy: s.report?.technicalAccuracy ?? 0,
        depth: s.report?.depth ?? 0, communication: s.report?.communication ?? 0, verdict: s.report?.verdict,
      })),
    };
  }

  async stats(userId: string) {
    const rows: any[] = await this.model.find({ userId, status: 'completed' }).select('-messages').sort({ endedAt: -1 }).limit(50).lean();
    const n = rows.length;
    const avg = (key: string) => (n ? Math.round(rows.reduce((a, r) => a + (r.report?.[key] ?? 0), 0) / n) : 0);
    const by = new Map<string, { name: string; sum: number; n: number }>();
    for (const r of rows) {
      const e = by.get(r.subject) ?? { name: r.subjectName ?? r.subject, sum: 0, n: 0 };
      e.sum += r.report?.overall ?? 0; e.n += 1; by.set(r.subject, e);
    }
    const best = [...by.entries()].sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)[0];
    return {
      sessions: n, avgOverall: avg('overall'), avgTechnicalAccuracy: avg('technicalAccuracy'),
      avgDepth: avg('depth'), avgCommunication: avg('communication'),
      bestSubject: best ? { slug: best[0], name: best[1].name, avg: Math.round(best[1].sum / best[1].n) } : null,
      trend: rows.slice(0, 12).reverse().map((r) => ({ id: String(r._id), at: r.endedAt, overall: r.report?.overall ?? 0, subjectName: r.subjectName })),
    };
  }

  // ---------------- admin ----------------
  async adminList(d: { page?: number; limit?: number; userId?: string }) {
    const limit = Math.min(Math.max(Number(d.limit) || 25, 1), 100);
    const page = Math.max(Number(d.page) || 1, 1);
    const filter: any = d.userId ? { userId: String(d.userId) } : {};
    const [rows, total] = await Promise.all([
      this.model.find(filter).select('-messages').sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return {
      total, page, limit,
      items: rows.map((s: any) => ({
        id: String(s._id), userId: s.userId, subjectName: s.subjectName, candidateRole: s.candidateRole, level: s.level,
        status: s.status, mode: s.mode, startedAt: s.startedAt, endedAt: s.endedAt, durationSec: s.durationSec,
        overall: s.report?.overall ?? null, tokens: (s.inputTokens ?? 0) + (s.outputTokens ?? 0),
      })),
    };
  }

  async adminGet(id: string) {
    const s = isValidObjectId(id) ? await this.model.findById(id).lean() : null;
    if (!s) throw new ApiError('Session not found', 'not_found');
    return { ...this.full(s), userId: (s as any).userId };
  }

  async adminStats() {
    const day = 86_400_000;
    const since = new Date(Date.now() - 13 * day); since.setHours(0, 0, 0, 0);
    const [total, completed, active, agg, perDay, bySubject] = await Promise.all([
      this.model.countDocuments({}),
      this.model.countDocuments({ status: 'completed' }),
      this.model.countDocuments({ status: 'active' }),
      this.model.aggregate([{ $group: { _id: null, inT: { $sum: '$inputTokens' }, outT: { $sum: '$outputTokens' },
        overall: { $avg: '$report.overall' }, acc: { $avg: '$report.technicalAccuracy' }, depth: { $avg: '$report.depth' }, comm: { $avg: '$report.communication' } } }]),
      this.model.aggregate([{ $match: { startedAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } }, n: { $sum: 1 } } }]),
      this.model.aggregate([{ $group: { _id: '$subjectName', n: { $sum: 1 }, avg: { $avg: '$report.overall' } } }, { $sort: { n: -1 } }, { $limit: 10 }]),
    ]);
    const a = agg[0] ?? {};
    const map = new Map<string, number>(perDay.map((r: any) => [r._id, r.n]));
    return {
      mode: this.llm.demo ? 'demo' : 'gemini', total, completed, active,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      avgOverall: Math.round(a.overall ?? 0), avgAccuracy: Math.round(a.acc ?? 0), avgDepth: Math.round(a.depth ?? 0), avgCommunication: Math.round(a.comm ?? 0),
      inputTokens: a.inT ?? 0, outputTokens: a.outT ?? 0,
      perDay: Array.from({ length: 14 }, (_, i) => { const k = new Date(since.getTime() + i * day).toISOString().slice(0, 10); return { date: k, count: map.get(k) ?? 0 }; }),
      bySubject: bySubject.map((r: any) => ({ name: r._id ?? 'Unknown', count: r.n, avg: Math.round(r.avg ?? 0) })),
    };
  }

  async deleteUser(userId: string) {
    const res = await this.model.deleteMany({ userId: String(userId) });
    return { deleted: res.deletedCount ?? 0 };
  }

  personas() {
    return Object.entries(PERSONAS).map(([subject, p]) => ({ subject, ...p }));
  }
}

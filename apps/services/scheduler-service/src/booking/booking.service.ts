import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { MailService } from './mail.service';
import { BookingDocument, InterviewBooking, STATUSES } from './schemas/booking.schema';

const MIN = 60_000;
const JOIN_EARLY_MIN = 10;
const JOIN_LATE_MIN = 30;
const MIN_LEAD_MIN = 5;
const MAX_AHEAD_DAYS = 60;
const MAX_RESCHEDULES = 3;
const fail = (status: number, message: string) => new RpcException({ status, message });

@Injectable()
export class BookingService {
  private readonly log = new Logger(BookingService.name);

  constructor(
    @InjectModel(InterviewBooking.name) private readonly model: Model<BookingDocument>,
    private readonly cfg: ConfigService,
    private readonly mail: MailService,
  ) {}

  private when(d: Date) { return new Date(d).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'; }

  private async confirmation(b: any, title: string) {
    if (!b.candidateEmail) return;
    await this.mail.send(b.candidateEmail, `${title}: ${b.subjectName} interview`, title, [
      `Your ${b.subjectName} mock interview (${b.candidateRole}, ${b.level}) is set for ${this.when(b.scheduledAt)}. It lasts ${b.durationMin} minutes.`,
      'The room opens 10 minutes before the start time. Use a quiet place and a microphone if you can.',
    ], { label: 'Open the interview room', url: `${this.mail.origin}/interview/${b._id}` });
  }

  private view(b: any) {
    const start = new Date(b.scheduledAt).getTime();
    const opens = start - JOIN_EARLY_MIN * MIN;
    const closes = start + (b.durationMin + JOIN_LATE_MIN) * MIN;
    const now = Date.now();
    return {
      id: String(b._id), userId: b.userId, subject: b.subject, subjectName: b.subjectName,
      candidateRole: b.candidateRole, level: b.level, candidateName: b.candidateName, scheduledAt: new Date(b.scheduledAt).toISOString(),
      durationMin: b.durationMin, status: b.status, sessionId: b.sessionId ?? null,
      rescheduleCount: b.rescheduleCount,
      joinOpensAt: new Date(opens).toISOString(), joinClosesAt: new Date(closes).toISOString(),
      joinable: ['scheduled', 'in_progress'].includes(b.status) && now >= opens && now <= closes,
    };
  }

  private async assertNoOverlap(userId: string, start: Date, durationMin: number, ignoreId?: string) {
    const from = new Date(start.getTime() - 90 * MIN);
    const to = new Date(start.getTime() + 90 * MIN);
    const near: any[] = await this.model
      .find({ userId, status: { $in: ['scheduled', 'in_progress'] }, scheduledAt: { $gt: from, $lt: to } })
      .lean();
    const s = start.getTime();
    const e = s + durationMin * MIN;
    for (const o of near) {
      if (ignoreId && String(o._id) === ignoreId) continue;
      const os = new Date(o.scheduledAt).getTime();
      if (s < os + o.durationMin * MIN && os < e) {
        throw fail(409, 'You already have an interview at that time');
      }
    }
  }

  private checkTime(start: Date, instant: boolean) {
    if (Number.isNaN(start.getTime())) throw fail(400, 'Invalid date');
    const now = Date.now();
    if (!instant && start.getTime() < now + MIN_LEAD_MIN * MIN) throw fail(400, 'Pick a time at least 5 minutes from now');
    if (start.getTime() > now + MAX_AHEAD_DAYS * 86_400_000) throw fail(400, 'You can book up to 60 days ahead');
  }

  async book(d: any) {
    const instant = Boolean(d.instant);
    const start = instant ? new Date() : new Date(d.scheduledAt);
    this.checkTime(start, instant);
    const upcoming = await this.model.countDocuments({ userId: d.userId, status: 'scheduled', scheduledAt: { $gt: new Date() } });
    if (upcoming >= Number(this.cfg.get('MAX_UPCOMING_BOOKINGS', 10))) {
      throw fail(429, 'You have too many upcoming interviews. Cancel one to book another');
    }
    await this.assertNoOverlap(d.userId, start, d.durationMin);
    const b = await this.model.create({
      userId: d.userId, subject: d.subject, subjectName: d.subjectName, candidateRole: d.candidateRole,
      level: d.level, scheduledAt: start, durationMin: d.durationMin,
      candidateName: d.candidateName ? String(d.candidateName).slice(0, 60) : undefined,
      candidateEmail: d.candidateEmail ? String(d.candidateEmail).slice(0, 120) : undefined,
    });
    this.confirmation(b, 'Interview booked').catch(() => undefined);
    return this.view(b.toObject());
  }

  private async own(id: string, userId: string): Promise<any> {
    if (!isValidObjectId(id)) throw fail(404, 'Booking not found');
    const b = await this.model.findOne({ _id: id, userId });
    if (!b) throw fail(404, 'Booking not found');
    return b;
  }

  async get(d: { id: string; userId: string }) {
    return this.view((await this.own(d.id, d.userId)).toObject());
  }

  async reschedule(d: { id: string; userId: string; scheduledAt: string }) {
    const b = await this.own(d.id, d.userId);
    if (b.status !== 'scheduled') throw fail(400, 'Only upcoming interviews can be rescheduled');
    if (b.rescheduleCount >= MAX_RESCHEDULES) throw fail(400, 'This interview was already rescheduled 3 times');
    if (new Date(b.scheduledAt).getTime() - Date.now() < JOIN_EARLY_MIN * MIN) {
      throw fail(400, 'The room is about to open, so this interview can no longer be moved');
    }
    const start = new Date(d.scheduledAt);
    this.checkTime(start, false);
    await this.assertNoOverlap(d.userId, start, b.durationMin, d.id);
    b.scheduledAt = start;
    b.rescheduleCount += 1;
    b.reminderSentAt = undefined;
    await b.save();
    this.confirmation(b, 'Interview rescheduled').catch(() => undefined);
    return this.view(b.toObject());
  }

  async cancel(d: { id: string; userId: string }) {
    const b = await this.own(d.id, d.userId);
    if (b.status !== 'scheduled') throw fail(400, 'Only upcoming interviews can be cancelled');
    b.status = 'cancelled';
    await b.save();
    return this.view(b.toObject());
  }

  async list(d: { userId: string; view?: 'upcoming' | 'past' | 'all'; page?: number; limit?: number }) {
    const limit = Math.min(Math.max(Number(d.limit) || 20, 1), 50);
    const page = Math.max(Number(d.page) || 1, 1);
    const cutoff = new Date(Date.now() - (45 + JOIN_LATE_MIN) * MIN);
    const live = { status: { $in: ['scheduled', 'in_progress'] }, scheduledAt: { $gt: cutoff } };
    const filter: any = { userId: d.userId };
    let sort: any = { scheduledAt: -1 };
    if (d.view === 'upcoming') { Object.assign(filter, live); sort = { scheduledAt: 1 }; }
    else if (d.view === 'past') filter.$nor = [live];
    const [items, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items: items.map((b) => this.view(b)), total, page, limit };
  }

  /** Internal: used by the AI service as interviews start and finish. */
  async updateStatus(d: { id: string; status: string; sessionId?: string }) {
    if (!isValidObjectId(d.id)) throw fail(404, 'Booking not found');
    if (!(STATUSES as readonly string[]).includes(d.status)) throw fail(400, 'Invalid status');
    const set: any = { status: d.status };
    if (d.sessionId !== undefined) set.sessionId = d.sessionId;
    const b = await this.model.findByIdAndUpdate(d.id, set, { new: true }).lean();
    if (!b) throw fail(404, 'Booking not found');
    return this.view(b);
  }

  // ---------------- admin ----------------
  async adminList(d: { status?: string; userId?: string; page?: number; limit?: number }) {
    const limit = Math.min(Math.max(Number(d.limit) || 25, 1), 100);
    const page = Math.max(Number(d.page) || 1, 1);
    const filter: any = {};
    if (d.status && (STATUSES as readonly string[]).includes(d.status)) filter.status = d.status;
    if (d.userId) filter.userId = String(d.userId);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ scheduledAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items: items.map((b) => this.view(b)), total, page, limit };
  }

  async adminCancel(d: { id: string }) {
    if (!isValidObjectId(d.id)) throw fail(404, 'Booking not found');
    const b: any = await this.model.findById(d.id);
    if (!b) throw fail(404, 'Booking not found');
    if (!['scheduled', 'in_progress'].includes(b.status)) throw fail(400, 'Only open bookings can be cancelled');
    b.status = 'cancelled';
    await b.save();
    return this.view(b.toObject());
  }

  async adminStats() {
    const now = new Date();
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const rows: any[] = await this.model.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
    const byStatus: Record<string, number> = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const r of rows) byStatus[r._id] = r.n;
    const [next24h, today] = await Promise.all([
      this.model.countDocuments({ status: 'scheduled', scheduledAt: { $gte: now, $lt: new Date(now.getTime() + 86_400_000) } }),
      this.model.countDocuments({ createdAt: { $gte: dayStart } }),
    ]);
    return { total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus, next24h, bookedToday: today };
  }

  async deleteUser(d: { userId: string }) {
    const res = await this.model.deleteMany({ userId: String(d.userId) });
    return { deleted: res.deletedCount ?? 0 };
  }

  /** Emails a reminder about 30 minutes before each interview. */
  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    const due: any[] = await this.model.find({
      status: 'scheduled', reminderSentAt: null as any, candidateEmail: { $exists: true, $ne: null },
      scheduledAt: { $gt: new Date(), $lte: new Date(Date.now() + 30 * MIN) },
    }).limit(100);
    for (const b of due) {
      const mins = Math.max(1, Math.round((new Date(b.scheduledAt).getTime() - Date.now()) / MIN));
      await this.mail.send(b.candidateEmail, `Starting soon: ${b.subjectName} interview`, `Your interview starts in about ${mins} minutes`,
        [`Your ${b.subjectName} mock interview begins at ${this.when(b.scheduledAt)}. The room is open now.`], { label: 'Join the room', url: `${this.mail.origin}/interview/${b._id}` });
      await this.model.updateOne({ _id: b._id }, { $set: { reminderSentAt: new Date() } });
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async markMissed() {
    const res = await this.model.updateMany(
      { status: 'scheduled', scheduledAt: { $lt: new Date(Date.now() - 90 * MIN) } },
      { status: 'missed' },
    );
    if (res.modifiedCount) this.log.log(`Marked ${res.modifiedCount} bookings as missed`);
  }
}

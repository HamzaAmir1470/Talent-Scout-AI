import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProgressDocument, UserProgress } from './schemas/progress.schema';

const KEY = /^[A-Za-z0-9/_-]{3,120}$/;
const bad = (m: string) => new RpcException({ status: 400, message: m });
const view = (p: any) => (p ? { bookmarks: p.bookmarks, progress: p.progress, selfTest: p.selfTest, updatedAt: p.clientUpdatedAt } : null);

/** Keeps bookmarks and quiz progress with the account so they follow the user across devices. Last write wins. */
@Injectable()
export class ProgressService {
  constructor(@InjectModel(UserProgress.name) private readonly model: Model<ProgressDocument>) {}

  async get(userId: string) {
    return view(await this.model.findOne({ userId }).lean());
  }

  async put(d: { userId: string; bookmarks: unknown; progress: unknown; selfTest: unknown; updatedAt: unknown }) {
    const bookmarks = Array.isArray(d.bookmarks) ? [...new Set(d.bookmarks.map(String))] : null;
    if (!bookmarks || bookmarks.length > 2000 || !bookmarks.every((k) => KEY.test(k))) throw bad('Invalid bookmarks');
    const entries = d.progress && typeof d.progress === 'object' && !Array.isArray(d.progress) ? Object.entries(d.progress as Record<string, unknown>) : null;
    if (!entries || entries.length > 2000 || !entries.every(([k, v]) => KEY.test(k) && (v === 'known' || v === 'review'))) throw bad('Invalid progress');
    const updatedAt = Number(d.updatedAt);
    if (!Number.isFinite(updatedAt) || updatedAt < 0) throw bad('Invalid timestamp');
    const current: any = await this.model.findOne({ userId: d.userId }).lean();
    if (current && current.clientUpdatedAt > updatedAt) return { ...view(current), conflict: true }; // another device wrote later
    const doc = { bookmarks, progress: Object.fromEntries(entries), selfTest: Boolean(d.selfTest), clientUpdatedAt: updatedAt };
    await this.model.updateOne({ userId: d.userId }, { $set: doc }, { upsert: true });
    return { ...view({ ...doc }), conflict: false };
  }
}

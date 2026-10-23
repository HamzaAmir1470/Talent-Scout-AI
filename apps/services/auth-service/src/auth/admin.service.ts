import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { AuthService } from './auth.service';
import { AuditDocument, AuditLog } from './schemas/audit.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { User, UserDocument } from './schemas/user.schema';

const fail = (status: number, message: string) => new RpcException({ status, message });
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private readonly tokens: Model<RefreshTokenDocument>,
    @InjectModel(AuditLog.name) private readonly logs: Model<AuditDocument>,
    private readonly auth: AuthService,
  ) {}

  async listUsers(d: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const limit = Math.min(Math.max(Number(d.limit) || 20, 1), 100);
    const page = Math.max(Number(d.page) || 1, 1);
    const filter: any = {};
    if (d.role && ['user', 'admin'].includes(d.role)) filter.role = d.role;
    if (d.status && ['active', 'suspended'].includes(d.status)) filter.status = d.status;
    if (d.search?.trim()) {
      const rx = new RegExp(esc(d.search.trim().slice(0, 60)), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const [items, total] = await Promise.all([
      this.users.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.users.countDocuments(filter),
    ]);
    return { items: items.map((u) => this.auth.view(u)), total, page, limit };
  }

  async usersByIds(ids: string[]) {
    const clean = (ids ?? []).filter(isValidObjectId).slice(0, 200);
    const rows = await this.users.find({ _id: { $in: clean } }).select('name email').lean();
    return Object.fromEntries(rows.map((u: any) => [String(u._id), { name: u.name, email: u.email }]));
  }

  async updateUser(d: { id: string; role?: string; status?: string; actorId: string; actorEmail: string; ip?: string }) {
    if (!isValidObjectId(d.id)) throw fail(404, 'User not found');
    if (d.id === d.actorId) throw fail(400, 'You cannot change your own role or status');
    const u: any = await this.users.findById(d.id);
    if (!u) throw fail(404, 'User not found');
    const set: any = {};
    if (d.role) {
      if (!['user', 'admin'].includes(d.role)) throw fail(400, 'Invalid role');
      set.role = d.role;
    }
    if (d.status) {
      if (!['active', 'suspended'].includes(d.status)) throw fail(400, 'Invalid status');
      set.status = d.status;
    }
    await this.users.updateOne({ _id: u._id }, { $set: set });
    if (set.status === 'suspended' || (set.role && set.role !== u.role)) await this.auth.revokeAll(d.id);
    await this.auth.audit({ actorId: d.actorId, actorEmail: d.actorEmail, action: 'admin.user.update', target: u.email, meta: set, ip: d.ip });
    return this.auth.view({ ...u.toObject(), ...set });
  }

  async revokeSessions(d: { id: string; actorId: string; actorEmail: string; ip?: string }) {
    await this.auth.revokeAll(d.id);
    await this.auth.audit({ actorId: d.actorId, actorEmail: d.actorEmail, action: 'admin.user.revoke_sessions', target: d.id, ip: d.ip });
    return { ok: true };
  }

  async deleteUser(d: { id: string; actorId: string; actorEmail: string; ip?: string }) {
    if (!isValidObjectId(d.id)) throw fail(404, 'User not found');
    if (d.id === d.actorId) throw fail(400, 'You cannot delete your own account');
    const u: any = await this.users.findById(d.id);
    if (!u) throw fail(404, 'User not found');
    await this.tokens.deleteMany({ userId: d.id });
    await this.users.deleteOne({ _id: u._id });
    await this.auth.audit({ actorId: d.actorId, actorEmail: d.actorEmail, action: 'admin.user.delete', target: u.email, ip: d.ip });
    return { ok: true, email: u.email };
  }

  async stats() {
    const day = 86_400_000;
    const since = new Date(Date.now() - 13 * day);
    since.setHours(0, 0, 0, 0);
    const [total, admins, suspended, new7, new30, sessions, perDay] = await Promise.all([
      this.users.countDocuments({}),
      this.users.countDocuments({ role: 'admin' }),
      this.users.countDocuments({ status: 'suspended' }),
      this.users.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * day) } }),
      this.users.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * day) } }),
      this.tokens.countDocuments({ revokedAt: null as any, expiresAt: { $gt: new Date() } }),
      this.users.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
      ]),
    ]);
    const map = new Map<string, number>(perDay.map((r: any) => [r._id, r.n]));
    const signups = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(since.getTime() + i * day);
      const key = d.toISOString().slice(0, 10);
      return { date: key, count: map.get(key) ?? 0 };
    });
    return { total, admins, suspended, new7, new30, activeSessions: sessions, signups };
  }

  async listAudit(d: { page?: number; limit?: number; action?: string }) {
    const limit = Math.min(Math.max(Number(d.limit) || 30, 1), 100);
    const page = Math.max(Number(d.page) || 1, 1);
    const filter: any = d.action ? { action: new RegExp('^' + esc(d.action.slice(0, 40))) } : {};
    const [items, total] = await Promise.all([
      this.logs.find(filter).sort({ at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.logs.countDocuments(filter),
    ]);
    return { items: items.map((l: any) => ({ id: String(l._id), at: l.at, actorEmail: l.actorEmail, action: l.action, target: l.target, meta: l.meta, ip: l.ip })), total, page, limit };
  }
}

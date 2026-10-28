import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { isValidObjectId, Model } from 'mongoose';
import { MailService } from './mail.service';
import { passwordProblem } from './password';
import { PasswordReset, PasswordResetDocument } from './schemas/password-reset.schema';
import { AuditDocument, AuditLog } from './schemas/audit.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { User, UserDocument } from './schemas/user.schema';

const fail = (status: number, message: string) => new RpcException({ status, message });
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const COST = 12;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;
const REUSE_GRACE_MS = 10_000;
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-value', COST);

export interface Ctx { ip?: string; userAgent?: string }

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) readonly users: Model<UserDocument>,
    @InjectModel(RefreshToken.name) readonly tokens: Model<RefreshTokenDocument>,
    @InjectModel(AuditLog.name) readonly logs: Model<AuditDocument>,
    @InjectModel(PasswordReset.name) readonly resets: Model<PasswordResetDocument>,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  view(u: any) {
    return {
      id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status,
      createdAt: u.createdAt, lastLoginAt: u.lastLoginAt ?? null,
    };
  }

  async audit(e: { actorId?: string; actorEmail?: string; action: string; target?: string; meta?: Record<string, unknown>; ip?: string }) {
    try { await this.logs.create(e); } catch (err) { this.log.warn(`audit failed: ${(err as Error).message}`); }
  }

  /** Creates or promotes the first administrator from ADMIN_EMAIL and ADMIN_PASSWORD. */
  async onApplicationBootstrap() {
    const email = this.cfg.get<string>('ADMIN_EMAIL')?.toLowerCase().trim();
    if (!email) return;
    const existing = await this.users.findOne({ email });
    if (existing) {
      if (existing.role !== 'admin') { await this.users.updateOne({ _id: existing._id }, { $set: { role: 'admin' } }); this.log.log(`Promoted ${email} to admin`); }
      return;
    }
    const pw = this.cfg.get<string>('ADMIN_PASSWORD');
    if (!pw || passwordProblem(pw, email)) { this.log.warn('ADMIN_EMAIL is set but ADMIN_PASSWORD is missing or too weak, so no admin was created'); return; }
    await this.users.create({
      name: 'Administrator', email, phone: this.cfg.get<string>('ADMIN_PHONE', '+15550000000'),
      passwordHash: await bcrypt.hash(pw, COST), role: 'admin', termsAcceptedAt: new Date(),
    });
    this.log.log(`Created admin account ${email}`);
  }

  private async issue(user: any, ctx: Ctx, family = randomUUID()) {
    const accessToken = this.jwt.sign({ sub: String(user._id), email: user.email, role: user.role, name: user.name });
    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(this.cfg.get('REFRESH_TOKEN_DAYS', 7));
    await this.tokens.create({
      userId: String(user._id), tokenHash: sha256(refreshToken), family,
      expiresAt: new Date(Date.now() + days * 86_400_000), userAgent: ctx.userAgent?.slice(0, 200), ip: ctx.ip,
    });
    return { accessToken, refreshToken, expiresIn: 900, user: this.view(user) };
  }

  async register(d: { name: string; email: string; phone: string; password: string; acceptTerms: boolean } & Ctx) {
    const email = String(d.email).toLowerCase().trim();
    const phone = String(d.phone).replace(/[\s()-]/g, '');
    const name = String(d.name).replace(/[\u0000-\u001f<>]/g, '').trim();
    if (!d.acceptTerms) throw fail(400, 'You must accept the terms to create an account');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw fail(400, 'Enter a valid phone number with country code');
    const problem = passwordProblem(d.password, email);
    if (problem) throw fail(400, problem);
    if (await this.users.findOne({ $or: [{ email }, { phone }] })) throw fail(409, 'An account with this email or phone number already exists');
    const user = await this.users.create({
      name, email, phone, passwordHash: await bcrypt.hash(d.password, COST), termsAcceptedAt: new Date(), lastLoginAt: new Date(), lastLoginIp: d.ip,
    });
    await this.audit({ actorId: String(user._id), actorEmail: email, action: 'user.register', ip: d.ip });
    return this.issue(user, d);
  }

  async login(d: { email: string; password: string } & Ctx) {
    const email = String(d.email).toLowerCase().trim();
    const user: any = await this.users.findOne({ email });
    if (!user) {
      await bcrypt.compare(String(d.password), DUMMY_HASH);
      await this.audit({ actorEmail: email, action: 'login.failed', meta: { reason: 'unknown_email' }, ip: d.ip });
      throw fail(401, 'Invalid email or password');
    }
    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60_000);
      throw fail(429, `Too many failed attempts. Try again in ${mins} minute${mins > 1 ? 's' : ''}`);
    }
    if (!(await bcrypt.compare(String(d.password), user.passwordHash))) {
      const fails = (user.failedLogins ?? 0) + 1;
      const lock = fails >= MAX_FAILS;
      await this.users.updateOne({ _id: user._id }, { $set: { failedLogins: lock ? 0 : fails, lockUntil: lock ? new Date(Date.now() + LOCK_MS) : null } });
      await this.audit({ actorId: String(user._id), actorEmail: email, action: lock ? 'login.locked' : 'login.failed', ip: d.ip });
      throw fail(401, 'Invalid email or password');
    }
    if (user.status === 'suspended') throw fail(403, 'This account is suspended. Contact support.');
    await this.users.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lockUntil: null, lastLoginAt: new Date(), lastLoginIp: d.ip } });
    await this.audit({ actorId: String(user._id), actorEmail: email, action: 'login.success', ip: d.ip });
    return this.issue(user, d);
  }

  /** Rotates the refresh token. Presenting an already used token revokes the whole login family. */
  async refresh(d: { refreshToken: string } & Ctx) {
    if (!d.refreshToken) throw fail(401, 'Session expired');
    const rt: any = await this.tokens.findOne({ tokenHash: sha256(String(d.refreshToken)) });
    if (!rt) throw fail(401, 'Session expired');
    if (rt.revokedAt) {
      const recent = Date.now() - new Date(rt.revokedAt).getTime() < REUSE_GRACE_MS && rt.replacedByHash;
      if (!recent) {
        await this.tokens.updateMany({ family: rt.family }, { $set: { revokedAt: new Date() } });
        await this.audit({ actorId: rt.userId, action: 'refresh.reuse_detected', ip: d.ip });
      }
      throw fail(401, 'Session expired');
    }
    if (new Date(rt.expiresAt).getTime() < Date.now()) throw fail(401, 'Session expired');
    const user: any = isValidObjectId(rt.userId) ? await this.users.findById(rt.userId) : null;
    if (!user || user.status === 'suspended') {
      await this.tokens.updateMany({ family: rt.family }, { $set: { revokedAt: new Date() } });
      throw fail(401, 'Session expired');
    }
    const next = await this.issue(user, d, rt.family);
    await this.tokens.updateOne({ _id: rt._id }, { $set: { revokedAt: new Date(), replacedByHash: sha256(next.refreshToken) } });
    return next;
  }

  async logout(d: { refreshToken?: string }) {
    if (!d.refreshToken) return { ok: true };
    const rt: any = await this.tokens.findOne({ tokenHash: sha256(String(d.refreshToken)) });
    if (rt) await this.tokens.updateMany({ family: rt.family }, { $set: { revokedAt: new Date() } });
    return { ok: true };
  }

  async revokeAll(userId: string) {
    await this.tokens.updateMany({ userId, revokedAt: null as any }, { $set: { revokedAt: new Date() } });
    return { ok: true };
  }

  async profile(userId: string) {
    const u = isValidObjectId(userId) ? await this.users.findById(userId) : null;
    if (!u) throw fail(404, 'User not found');
    return this.view(u);
  }

  async changePassword(d: { userId: string; current: string; next: string } & Ctx) {
    const u: any = isValidObjectId(d.userId) ? await this.users.findById(d.userId) : null;
    if (!u) throw fail(404, 'User not found');
    if (!(await bcrypt.compare(String(d.current), u.passwordHash))) throw fail(400, 'Your current password is not correct');
    const problem = passwordProblem(d.next, u.email);
    if (problem) throw fail(400, problem);
    await this.users.updateOne({ _id: u._id }, { $set: { passwordHash: await bcrypt.hash(d.next, COST), passwordChangedAt: new Date() } });
    await this.revokeAll(String(u._id));
    await this.audit({ actorId: String(u._id), actorEmail: u.email, action: 'password.changed', ip: d.ip });
    return { ok: true };
  }

  /** Always answers the same way, so nobody can use this form to find out which emails have accounts. */
  async forgotPassword(d: { email: string } & Ctx) {
    const email = String(d.email).toLowerCase().trim();
    const user: any = await this.users.findOne({ email });
    if (user && user.status !== 'suspended') {
      await this.resets.updateMany({ userId: String(user._id), usedAt: null as any }, { $set: { usedAt: new Date() } });
      const raw = randomBytes(32).toString('base64url');
      await this.resets.create({ userId: String(user._id), tokenHash: sha256(raw), expiresAt: new Date(Date.now() + 30 * 60_000) });
      await this.mail.send(email, 'Reset your Talent Scout AI password', 'Reset your password',
        [`Hi ${String(user.name).split(' ')[0]}, we received a request to reset your password.`, 'This link works for 30 minutes and can be used once. If you did not ask for it, you can ignore this email.'],
        { label: 'Choose a new password', url: `${this.mail.origin}/reset-password?token=${raw}` });
    }
    await this.audit({ actorEmail: email, action: 'password.reset_requested', ip: d.ip });
    return { ok: true };
  }

  async resetPassword(d: { token: string; password: string } & Ctx) {
    const rec: any = d.token ? await this.resets.findOne({ tokenHash: sha256(String(d.token)) }) : null;
    if (!rec || rec.usedAt || new Date(rec.expiresAt).getTime() < Date.now()) throw fail(400, 'This reset link is invalid or has expired. Request a new one.');
    const user: any = isValidObjectId(rec.userId) ? await this.users.findById(rec.userId) : null;
    if (!user) throw fail(400, 'This reset link is invalid or has expired. Request a new one.');
    const problem = passwordProblem(d.password, user.email);
    if (problem) throw fail(400, problem);
    await this.users.updateOne({ _id: user._id }, { $set: { passwordHash: await bcrypt.hash(d.password, COST), passwordChangedAt: new Date(), failedLogins: 0, lockUntil: null } });
    await this.resets.updateOne({ _id: rec._id }, { $set: { usedAt: new Date() } });
    await this.revokeAll(String(user._id));
    await this.audit({ actorId: String(user._id), actorEmail: user.email, action: 'password.reset_completed', ip: d.ip });
    return { ok: true };
  }
}

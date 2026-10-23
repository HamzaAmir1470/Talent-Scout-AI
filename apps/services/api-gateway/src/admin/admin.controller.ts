import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CacheService } from '../common/cache.service';
import { rpc } from '../rpc';
import { QuestionDto, SubjectDto, TopicDto, UpdateUserDto } from './admin.dto';

type AdminReq = { user: { sub: string; email: string }; ip?: string };
const num = (v?: string) => (v ? Number(v) : undefined);

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly auth: ClientProxy,
    @Inject('CONTENT_SERVICE') private readonly content: ClientProxy,
    @Inject('SCHEDULER_SERVICE') private readonly scheduler: ClientProxy,
    @Inject('AI_SERVICE') private readonly ai: ClientProxy,
    private readonly cache: CacheService,
  ) {}

  private audit(req: AdminReq, action: string, target?: string, meta?: Record<string, unknown>) {
    return rpc(this.auth, 'auth.audit', { actorId: req.user.sub, actorEmail: req.user.email, action, target, meta, ip: req.ip }).catch(() => undefined);
  }
  private async ping(c: ClientProxy) {
    try { await firstValueFrom(c.send('health.ping', {}).pipe(timeout(1500))); return 'up'; } catch { return 'down'; }
  }
  /** Adds name and email to rows that only carry a userId. */
  private async withUsers<T extends { userId: string }>(items: T[]) {
    const ids = [...new Set(items.map((i) => i.userId))];
    const users = ids.length ? await rpc<Record<string, { name: string; email: string }>>(this.auth, 'auth.admin.usersByIds', { ids }) : {};
    return items.map((i) => ({ ...i, user: users[i.userId] ?? null }));
  }

  // ---------------- overview ----------------
  @Get('overview')
  async overview() {
    const [users, bookings, interviews, content, health] = await Promise.all([
      rpc(this.auth, 'auth.admin.stats', {}), rpc(this.scheduler, 'scheduler.admin.stats', {}),
      rpc(this.ai, 'ai.admin.stats', {}), rpc(this.content, 'content.admin.stats', {}),
      Promise.all([this.ping(this.auth), this.ping(this.content), this.ping(this.scheduler), this.ping(this.ai)]),
    ]);
    return { users, bookings, interviews, content, health: { auth: health[0], content: health[1], scheduler: health[2], ai: health[3] } };
  }

  // ---------------- users ----------------
  @Get('users')
  users(@Query('search') search?: string, @Query('role') role?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return rpc(this.auth, 'auth.admin.listUsers', { search, role, status, page: num(page), limit: num(limit) });
  }

  @Patch('users/:id')
  updateUser(@Req() req: AdminReq, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return rpc(this.auth, 'auth.admin.updateUser', { id, ...dto, actorId: req.user.sub, actorEmail: req.user.email, ip: req.ip });
  }

  @Post('users/:id/revoke-sessions')
  revoke(@Req() req: AdminReq, @Param('id') id: string) {
    return rpc(this.auth, 'auth.admin.revokeSessions', { id, actorId: req.user.sub, actorEmail: req.user.email, ip: req.ip });
  }

  /** Full removal for privacy requests: the account, bookings and interview transcripts. */
  @Delete('users/:id')
  async deleteUser(@Req() req: AdminReq, @Param('id') id: string) {
    const res = await rpc<{ email: string }>(this.auth, 'auth.admin.deleteUser', { id, actorId: req.user.sub, actorEmail: req.user.email, ip: req.ip });
    const [b, s] = await Promise.all([rpc(this.scheduler, 'scheduler.admin.deleteUser', { userId: id }), rpc(this.ai, 'ai.admin.deleteUser', { userId: id })]);
    return { ...res, bookings: b, sessions: s };
  }

  // ---------------- bookings and interviews ----------------
  @Get('bookings')
  async bookings(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const r = await rpc<{ items: any[] }>(this.scheduler, 'scheduler.admin.list', { status, page: num(page), limit: num(limit) });
    return { ...r, items: await this.withUsers(r.items) };
  }

  @Patch('bookings/:id/cancel')
  async cancelBooking(@Req() req: AdminReq, @Param('id') id: string) {
    const r = await rpc(this.scheduler, 'scheduler.admin.cancel', { id });
    await this.audit(req, 'admin.booking.cancel', id);
    return r;
  }

  @Get('sessions')
  async sessions(@Query('page') page?: string, @Query('limit') limit?: string) {
    const r = await rpc<{ items: any[] }>(this.ai, 'ai.admin.list', { page: num(page), limit: num(limit) });
    return { ...r, items: await this.withUsers(r.items) };
  }

  @Get('sessions/:id')
  async session(@Req() req: AdminReq, @Param('id') id: string) {
    const s = await rpc<any>(this.ai, 'ai.admin.get', { id });
    await this.audit(req, 'admin.session.view', id);
    return s;
  }

  // ---------------- content management ----------------
  @Get('content/topics') listTopics() { return rpc(this.content, 'content.admin.listTopics', {}); }
  @Get('content/topics/:id') getTopic(@Param('id') id: string) { return rpc(this.content, 'content.admin.getTopic', { id }); }

  @Post('content/topics')
  async createTopic(@Req() req: AdminReq, @Body() dto: TopicDto) {
    const r = await rpc<{ id: string }>(this.content, 'content.admin.saveTopic', dto);
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.topic.create', dto.title);
    return r;
  }

  @Put('content/topics/:id')
  async updateTopic(@Req() req: AdminReq, @Param('id') id: string, @Body() dto: TopicDto) {
    const r = await rpc(this.content, 'content.admin.saveTopic', { ...dto, id });
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.topic.update', dto.title);
    return r;
  }

  @Delete('content/topics/:id')
  async deleteTopic(@Req() req: AdminReq, @Param('id') id: string) {
    const r = await rpc<{ title: string }>(this.content, 'content.admin.deleteTopic', { id });
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.topic.delete', r.title);
    return r;
  }

  @Post('content/questions')
  async createQuestion(@Req() req: AdminReq, @Body() dto: QuestionDto) {
    const r = await rpc(this.content, 'content.admin.saveQuestion', dto);
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.question.create', dto.topicId);
    return r;
  }

  @Put('content/questions/:id')
  async updateQuestion(@Req() req: AdminReq, @Param('id') id: string, @Body() dto: QuestionDto) {
    const r = await rpc(this.content, 'content.admin.saveQuestion', { ...dto, id });
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.question.update', id);
    return r;
  }

  @Delete('content/questions/:id')
  async deleteQuestion(@Req() req: AdminReq, @Param('id') id: string) {
    const r = await rpc(this.content, 'content.admin.deleteQuestion', { id });
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.question.delete', id);
    return r;
  }

  @Put('content/subjects/:id')
  async updateSubject(@Req() req: AdminReq, @Param('id') id: string, @Body() dto: SubjectDto) {
    const r = await rpc(this.content, 'content.admin.saveSubject', { ...dto, id });
    await this.cache.invalidate('content:');
    await this.audit(req, 'admin.content.subject.update', dto.name);
    return r;
  }

  // ---------------- system ----------------
  @Get('audit')
  audits(@Query('page') page?: string, @Query('limit') limit?: string, @Query('action') action?: string) {
    return rpc(this.auth, 'auth.admin.listAudit', { page: num(page), limit: num(limit), action });
  }

  @Post('cache/clear')
  async clearCache(@Req() req: AdminReq) {
    await this.cache.invalidate('');
    await this.audit(req, 'admin.cache.clear');
    return { ok: true };
  }
}

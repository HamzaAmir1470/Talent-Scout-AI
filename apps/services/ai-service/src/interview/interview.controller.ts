import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { InterviewService } from './interview.service';
import { ApiError } from './types';

const wrap = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  try { return await fn(); }
  catch (e) {
    if (e instanceof ApiError) throw new RpcException({ status: e.code === 'not_found' ? 404 : 400, message: e.message });
    throw e;
  }
};

@Controller()
export class InterviewController {
  constructor(private readonly svc: InterviewService) {}

  @Get('health') health() { return { status: 'ok' }; }

  @MessagePattern('health.ping') ping() { return 'pong'; }
  @MessagePattern('ai.getPersonas') personas() { return this.svc.personas(); }
  @MessagePattern('ai.admin.list') adminList(@Payload() d: any) { return this.svc.adminList(d); }
  @MessagePattern('ai.admin.get') adminGet(@Payload() d: { id: string }) { return wrap(() => this.svc.adminGet(d.id)); }
  @MessagePattern('ai.admin.stats') adminStats() { return this.svc.adminStats(); }
  @MessagePattern('ai.admin.deleteUser') adminDelete(@Payload() d: { userId: string }) { return this.svc.deleteUser(d.userId); }
  @MessagePattern('ai.getStats') stats(@Payload() d: { userId: string }) { return wrap(() => this.svc.stats(d.userId)); }
  @MessagePattern('ai.listSessions')
  list(@Payload() d: { userId: string; page?: number; limit?: number }) { return wrap(() => this.svc.list(d.userId, d.page, d.limit)); }
  @MessagePattern('ai.getSession')
  get(@Payload() d: { id: string; userId: string }) { return wrap(() => this.svc.getSession(d.id, d.userId)); }
  @MessagePattern('ai.getSessionByBooking')
  byBooking(@Payload() d: { bookingId: string; userId: string }) { return wrap(() => this.svc.getByBooking(d.bookingId, d.userId)); }
}

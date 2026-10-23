import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BookingService } from './booking.service';

@Controller()
export class BookingController {
  constructor(private readonly svc: BookingService) {}

  @MessagePattern('health.ping') ping() { return 'pong'; }
  @MessagePattern('scheduler.book') book(@Payload() d: any) { return this.svc.book(d); }
  @MessagePattern('scheduler.reschedule') reschedule(@Payload() d: any) { return this.svc.reschedule(d); }
  @MessagePattern('scheduler.cancel') cancel(@Payload() d: any) { return this.svc.cancel(d); }
  @MessagePattern('scheduler.getUserBookings') list(@Payload() d: any) { return this.svc.list(d); }
  @MessagePattern('scheduler.getBooking') get(@Payload() d: any) { return this.svc.get(d); }
  @MessagePattern('scheduler.admin.list') adminList(@Payload() d: any) { return this.svc.adminList(d); }
  @MessagePattern('scheduler.admin.cancel') adminCancel(@Payload() d: any) { return this.svc.adminCancel(d); }
  @MessagePattern('scheduler.admin.stats') adminStats() { return this.svc.adminStats(); }
  @MessagePattern('scheduler.admin.deleteUser') adminDelete(@Payload() d: any) { return this.svc.deleteUser(d); }
  @MessagePattern('scheduler.updateStatus') status(@Payload() d: any) { return this.svc.updateStatus(d); }
}

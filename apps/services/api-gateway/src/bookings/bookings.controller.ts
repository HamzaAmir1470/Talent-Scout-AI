import {
  BadRequestException, Body, Controller, Get, Header, Inject, Param, Patch, Post, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CacheService } from '../common/cache.service';
import { rpc } from '../rpc';
import { CreateBookingDto, RescheduleDto } from './bookings.dto';

type Req_ = { user: { sub: string } };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    @Inject('SCHEDULER_SERVICE') private readonly scheduler: ClientProxy,
    @Inject('CONTENT_SERVICE') private readonly content: ClientProxy,
    private readonly cache: CacheService,
  ) {}

  @Post()
  async create(@Req() req: Req_, @Body() dto: CreateBookingDto) {
    const subjects = await this.cache.wrap<any[]>('content:subjects', 300, () => rpc(this.content, 'content.getSubjects', {}));
    const subject = subjects.find((s) => s.slug === dto.subject);
    if (!subject) throw new BadRequestException('Unknown subject');
    if (!dto.instant && !dto.scheduledAt) throw new BadRequestException('Pick a date and time');
    return rpc(this.scheduler, 'scheduler.book', {
      ...dto, userId: req.user.sub, subjectName: subject.name,
      candidateRole: dto.candidateRole.replace(/[\u0000-\u001f]/g, ' ').trim(),
    });
  }

  @Get()
  list(@Req() req: Req_, @Query('view') view?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return rpc(this.scheduler, 'scheduler.getUserBookings', {
      userId: req.user.sub, view: ['upcoming', 'past'].includes(view ?? '') ? view : 'all',
      page: Number(page) || 1, limit: Number(limit) || 20,
    });
  }

  @Get(':id')
  get(@Req() req: Req_, @Param('id') id: string) {
    return rpc(this.scheduler, 'scheduler.getBooking', { id, userId: req.user.sub });
  }

  @Patch(':id/reschedule')
  reschedule(@Req() req: Req_, @Param('id') id: string, @Body() dto: RescheduleDto) {
    return rpc(this.scheduler, 'scheduler.reschedule', { id, userId: req.user.sub, scheduledAt: dto.scheduledAt });
  }

  @Patch(':id/cancel')
  cancel(@Req() req: Req_, @Param('id') id: string) {
    return rpc(this.scheduler, 'scheduler.cancel', { id, userId: req.user.sub });
  }

  /** Calendar file so candidates never miss a session. */
  @Get(':id/ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async ics(@Req() req: Req_, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const b: any = await rpc(this.scheduler, 'scheduler.getBooking', { id, userId: req.user.sub });
    const end = new Date(new Date(b.scheduledAt).getTime() + b.durationMin * 60_000).toISOString();
    const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',')[0];
    res.setHeader('Content-Disposition', `attachment; filename="interview-${id}.ics"`);
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Talent Scout AI//EN', 'BEGIN:VEVENT',
      `UID:${id}@talentscout`, `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(b.scheduledAt)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`AI interview: ${b.subjectName} (${b.candidateRole})`)}`,
      `DESCRIPTION:${esc(`Join the voice room: ${origin}/interview/${id}`)}`,
      `URL:${origin}/interview/${id}`,
      'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Interview starts soon', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }
}

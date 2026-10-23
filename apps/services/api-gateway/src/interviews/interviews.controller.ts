import { Controller, Get, Inject, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CacheService } from '../common/cache.service';
import { rpc } from '../rpc';

type Req_ = { user: { sub: string } };

@Controller('interviews')
export class InterviewsController {
  constructor(
    @Inject('AI_SERVICE') private readonly ai: ClientProxy,
    private readonly cache: CacheService,
  ) {}

  @Get('personas')
  personas() {
    return this.cache.wrap('ai:personas', 3600, () => rpc(this.ai, 'ai.getPersonas', {}));
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  stats(@Req() req: Req_) {
    return rpc(this.ai, 'ai.getStats', { userId: req.user.sub });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: Req_, @Query('page') page?: string, @Query('limit') limit?: string) {
    return rpc(this.ai, 'ai.listSessions', { userId: req.user.sub, page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @UseGuards(JwtAuthGuard)
  @Get('booking/:bookingId')
  byBooking(@Req() req: Req_, @Param('bookingId') bookingId: string) {
    return rpc(this.ai, 'ai.getSessionByBooking', { bookingId, userId: req.user.sub });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  get(@Req() req: Req_, @Param('id') id: string) {
    return rpc(this.ai, 'ai.getSession', { id, userId: req.user.sub });
  }
}

import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SkipThrottle } from '@nestjs/throttler';
import { firstValueFrom, timeout } from 'rxjs';

@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly deps: Record<string, ClientProxy>;

  constructor(
    @Inject('AUTH_SERVICE') auth: ClientProxy,
    @Inject('CONTENT_SERVICE') content: ClientProxy,
    @Inject('SCHEDULER_SERVICE') scheduler: ClientProxy,
    @Inject('AI_SERVICE') ai: ClientProxy,
  ) {
    this.deps = { auth, content, scheduler, ai };
  }

  /** Liveness: the process is up. */
  @Get() live() { return { status: 'ok', uptime: Math.round(process.uptime()) }; }

  /** Readiness: every downstream service answers. */
  @Get('ready')
  async ready() {
    const entries = await Promise.all(
      Object.entries(this.deps).map(async ([name, c]) => {
        try { await firstValueFrom(c.send('health.ping', {}).pipe(timeout(1500))); return [name, 'up'] as const; }
        catch { return [name, 'down'] as const; }
      }),
    );
    const services = Object.fromEntries(entries);
    if (entries.some(([, s]) => s === 'down')) throw new ServiceUnavailableException({ status: 'degraded', services });
    return { status: 'ready', services };
  }
}

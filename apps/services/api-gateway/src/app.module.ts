import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminController } from './admin/admin.controller';
import { AdminGuard } from './auth/admin.guard';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BookingsController } from './bookings/bookings.controller';
import { CacheService } from './common/cache.service';
import { requireSecret } from './common/secret';
import { ContentController } from './content/content.controller';
import { HealthController } from './health.controller';
import { InterviewsController } from './interviews/interviews.controller';

const tcpClient = (name: string, hostKey: string, portKey: string, defPort: number) => ({
  name,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    transport: Transport.TCP as const,
    options: { host: cfg.get<string>(hostKey, '127.0.0.1'), port: Number(cfg.get(portKey, defPort)) },
  }),
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ secret: requireSecret(cfg) }),
    }),
    ClientsModule.registerAsync([
      tcpClient('AUTH_SERVICE', 'AUTH_SERVICE_HOST', 'AUTH_SERVICE_PORT', 4001),
      tcpClient('CONTENT_SERVICE', 'CONTENT_SERVICE_HOST', 'CONTENT_SERVICE_PORT', 4002),
      tcpClient('SCHEDULER_SERVICE', 'SCHEDULER_SERVICE_HOST', 'SCHEDULER_SERVICE_PORT', 4003),
      tcpClient('AI_SERVICE', 'AI_SERVICE_HOST', 'AI_SERVICE_PORT', 4014),
    ]),
  ],
  controllers: [AuthController, AdminController, ContentController, BookingsController, InterviewsController, HealthController],
  providers: [JwtAuthGuard, AdminGuard, CacheService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

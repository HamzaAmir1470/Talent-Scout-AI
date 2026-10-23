import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from './interview.controller';
import { InterviewGateway } from './interview.gateway';
import { InterviewService } from './interview.service';
import { LlmService } from './llm.service';
import { InterviewSession, SessionSchema } from './schemas/session.schema';
import { SttService } from './stt.service';
import { requireSecret } from './secret';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InterviewSession.name, schema: SessionSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({ secret: requireSecret(cfg) }),
    }),
    ClientsModule.registerAsync([{
      name: 'SCHEDULER_SERVICE',
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: Transport.TCP as const,
        options: { host: cfg.get<string>('SCHEDULER_SERVICE_HOST', '127.0.0.1'), port: Number(cfg.get('SCHEDULER_SERVICE_PORT', 4003)) },
      }),
    }]),
  ],
  controllers: [InterviewController],
  providers: [InterviewGateway, InterviewService, LlmService, SttService],
})
export class InterviewModule {}

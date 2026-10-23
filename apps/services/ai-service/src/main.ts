import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);

  const origins = cfg.get<string>('WEB_ORIGIN', 'http://localhost:3000').split(',');
  const adapter = new RedisIoAdapter(app, origins, cfg.get<string>('REDIS_URL'));
  await adapter.connectToRedis();
  app.useWebSocketAdapter(adapter);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: Number(cfg.get('AI_SERVICE_PORT', 4014)) },
  });
  app.enableShutdownHooks();
  await app.startAllMicroservices();
  const port = Number(cfg.get('AI_HTTP_PORT', 4004));
  await app.listen(port);
  console.log(`AI service: WebSocket :${port}, TCP :${cfg.get('AI_SERVICE_PORT', 4014)}`);
}
bootstrap();

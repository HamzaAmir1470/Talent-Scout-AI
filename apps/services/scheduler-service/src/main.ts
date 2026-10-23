import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.SCHEDULER_SERVICE_PORT ?? 4003);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port },
  });
  app.enableShutdownHooks();
  await app.listen();
  console.log(`Scheduler service listening on TCP :${port}`);
}
bootstrap();

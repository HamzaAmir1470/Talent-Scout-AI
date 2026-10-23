import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1); // real client IPs behind Nginx, so rate limits work per user
  app.disable('x-powered-by');
  app.use(json({ limit: '256kb' }));
  app.use(urlencoded({ extended: false, limit: '64kb' }));
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();
  const port = Number(process.env.GATEWAY_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway running on http://localhost:${port}`);
}
bootstrap();

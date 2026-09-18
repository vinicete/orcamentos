import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { BETTER_AUTH, type Auth } from './auth/better-auth.js';

async function bootstrap() {
  // body parser desligado: o handler do Better Auth precisa do corpo cru, então é montado antes do parser
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3002',
    credentials: true,
  });
  app
    .getHttpAdapter()
    .getInstance()
    .all('/api/auth/*splat', toNodeHandler(app.get<Auth>(BETTER_AUTH)));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? process.env.API_PORT ?? 3001);
}
await bootstrap();

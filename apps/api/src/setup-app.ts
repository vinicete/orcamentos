import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import { BETTER_AUTH, type Auth } from './auth/better-auth.js';

export function configureApp(app: NestExpressApplication, webOrigin: string): void {
  app.enableCors({ origin: webOrigin, credentials: true });
  app
    .getHttpAdapter()
    .getInstance()
    .all('/api/auth/*splat', toNodeHandler(app.get<Auth>(BETTER_AUTH)));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}

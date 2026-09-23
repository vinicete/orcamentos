import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './setup-app.js';

async function bootstrap() {
  // body parser desligado: o handler do Better Auth precisa do corpo cru, então é montado antes do parser
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app, process.env.WEB_ORIGIN ?? 'http://localhost:3002');
  await app.listen(process.env.PORT ?? process.env.API_PORT ?? 3001);
}
await bootstrap();

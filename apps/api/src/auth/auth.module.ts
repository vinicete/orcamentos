import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { BETTER_AUTH, createAuth } from './better-auth.js';
import { SessionGuard } from './guards/session.guard.js';

@Global()
@Module({
  providers: [
    SessionGuard,
    {
      provide: BETTER_AUTH,
      inject: [PrismaService, ConfigService],
      useFactory: createAuth,
    },
  ],
  exports: [SessionGuard, BETTER_AUTH],
})
export class AuthModule {}

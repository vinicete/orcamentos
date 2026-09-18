import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { BETTER_AUTH, createAuth } from './better-auth.js';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { SessionGuard } from './guards/session.guard.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';

// @Global(): outros módulos usam @UseGuards(JwtAccessGuard) sem precisar
// importar PassportModule de novo — o guard do Passport injeta AuthModuleOptions,
// que só existe onde PassportModule.register() foi chamado.
@Global()
@Module({
  imports: [UsersModule, PassportModule.register({}), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtAccessGuard,
    JwtRefreshGuard,
    SessionGuard,
    {
      provide: BETTER_AUTH,
      inject: [PrismaService, ConfigService],
      useFactory: createAuth,
    },
  ],
  exports: [PassportModule, JwtAccessGuard, JwtRefreshGuard, SessionGuard, BETTER_AUTH],
})
export class AuthModule {}

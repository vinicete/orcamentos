import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';

// @Global(): outros módulos usam @UseGuards(JwtAccessGuard) sem precisar
// importar PassportModule de novo — o guard do Passport injeta AuthModuleOptions,
// que só existe onde PassportModule.register() foi chamado.
@Global()
@Module({
  imports: [UsersModule, PassportModule.register({}), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, JwtAccessGuard, JwtRefreshGuard],
  exports: [PassportModule, JwtAccessGuard, JwtRefreshGuard],
})
export class AuthModule {}

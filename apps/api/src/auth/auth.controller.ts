import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService, type AuthTokens } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import type { JwtPayload } from './jwt-payload.js';
import { durationToMs } from './utils/duration.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const tokens = this.auth.issueTokens(user);
    this.setAuthCookies(res, tokens);
    return { id: user.id, email: user.email };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() jwtUser: JwtPayload, @Res({ passthrough: true }) res: Response) {
    const tokens = this.auth.issueTokens({ id: jwtUser.sub, email: jwtUser.email });
    this.setAuthCookies(res, tokens);
    return { id: jwtUser.sub, email: jwtUser.email };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  me(@CurrentUser() jwtUser: JwtPayload) {
    return this.auth.me(jwtUser.sub);
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    const sameSite = secure ? 'none' : 'lax';
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
      maxAge: durationToMs(this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m')),
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
      maxAge: durationToMs(this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')),
    });
  }
}

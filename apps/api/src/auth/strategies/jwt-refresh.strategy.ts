import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../jwt-payload.js';

const fromRefreshCookie = (req: Request): string | null => {
  const token = req.cookies?.refresh_token;
  return typeof token === 'string' ? token : null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET não configurado');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromRefreshCookie]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.sub) throw new UnauthorizedException();
    return payload;
  }
}

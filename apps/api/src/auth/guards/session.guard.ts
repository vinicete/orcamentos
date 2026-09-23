import {
  CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { BETTER_AUTH, type Auth } from '../better-auth.js';
import type { AuthUser } from '../auth-user.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(BETTER_AUTH) private readonly auth: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user: AuthUser }>();
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException();

    req.user = { sub: session.user.id, email: session.user.email };
    return true;
  }
}

import { randomUUID } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bootstrapNewUser } from './bootstrap-new-user.js';
import { createEmailSender, resetPasswordEmailHtml, verificationEmailHtml } from './email.js';

export const BETTER_AUTH = Symbol('BETTER_AUTH');

export function createAuth(prisma: PrismaClient, config: ConfigService) {
  const cookieDomain = config.get<string>('AUTH_COOKIE_DOMAIN');
  const sendEmail = createEmailSender(config);

  return betterAuth({
    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'),
    basePath: '/api/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: ({ user, url }) =>
        sendEmail(user.email, 'Redefinir senha — Orçamento', resetPasswordEmailHtml(url)),
      revokeSessionsOnPasswordReset: true,
    },
    // requireEmailVerification fica desligado até o Resend estar confirmado de ponta a ponta (Fase 13.4)
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: ({ user, url }) =>
        sendEmail(user.email, 'Confirme seu e-mail — Orçamento', verificationEmailHtml(url)),
    },
    trustedOrigins: [config.get<string>('WEB_ORIGIN', 'http://localhost:3002')],
    databaseHooks: {
      user: {
        create: {
          after: (user) => bootstrapNewUser(prisma, user.id),
        },
      },
    },
    advanced: {
      cookiePrefix: 'orcamento',
      // função em vez de 'uuid': com 'uuid' o adapter delega o id ao default do banco, que as tabelas não têm
      database: { generateId: () => randomUUID() },
      ...(cookieDomain && { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

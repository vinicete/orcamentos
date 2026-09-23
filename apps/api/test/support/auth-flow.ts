import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

// requireEmailVerification: true (Fase 13.4) — sign-up não loga mais sozinho.
// RESEND_API_KEY vazio nos testes (vitest.config.e2e.ts) faz o link cair no console.warn.
function extractLoggedLink(warnSpy: ReturnType<typeof vi.spyOn>, pathSegment: string): string {
  const call = warnSpy.mock.calls.find((c) => String(c[0]).includes(pathSegment));
  if (!call) throw new Error(`Nenhum e-mail logado contendo "${pathSegment}"`);
  const match = /href="([^"]+)"/.exec(String(call[0]));
  if (!match) throw new Error('Link não encontrado no e-mail logado');
  return match[1];
}

export interface VerifiedUser {
  agent: ReturnType<typeof request.agent>;
  userId: string;
  email: string;
}

export async function signUpVerifiedUser(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<VerifiedUser> {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const signUp = await request
    .agent(app.getHttpServer())
    .post('/api/auth/sign-up/email')
    .send({ email, password, name: email })
    .expect(200);
  const userId: string = signUp.body.user.id;

  const link = extractLoggedLink(warnSpy, '/verify-email?token=');
  warnSpy.mockRestore();
  const verifyUrl = link.replace(/^https?:\/\/[^/]+/, '');
  await request(app.getHttpServer()).get(verifyUrl).expect(302);

  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/auth/sign-in/email').send({ email, password }).expect(200);

  return { agent, userId, email };
}

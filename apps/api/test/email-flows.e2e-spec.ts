import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { configureApp } from '../src/setup-app.js';

// RESEND_API_KEY não está configurado neste ambiente de teste, então o e-mail cai no
// log (ver auth/email.ts) em vez de sair pelo Resend — os testes capturam o link de lá.
function extractLoggedLink(warnSpy: ReturnType<typeof vi.spyOn>, pathSegment: string): string {
  const call = warnSpy.mock.calls.find((c) => String(c[0]).includes(pathSegment));
  if (!call) throw new Error(`Nenhum e-mail logado contendo "${pathSegment}"`);
  const match = /href="([^"]+)"/.exec(String(call[0]));
  if (!match) throw new Error('Link não encontrado no e-mail logado');
  return match[1];
}

describe('Fluxos de e-mail — verificação e reset de senha (Fase 13.4)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let email: string;
  const password = 'senha-forte-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>(undefined, {
      bodyParser: false,
    });
    configureApp(app as unknown as NestExpressApplication, 'http://localhost:3002');
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    agent = request.agent(app.getHttpServer());
    email = `email-flows-${Date.now()}@teste.local`;
  });

  afterAll(async () => {
    await prisma.expense.deleteMany({ where: { userId } });
    await prisma.fixedItem.deleteMany({ where: { userId } });
    await prisma.category.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('cadastro dispara e-mail de verificação e o link confirma a conta', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await agent
      .post('/api/auth/sign-up/email')
      .send({ email, password, name: email })
      .expect(200);
    userId = res.body.user.id;

    const link = extractLoggedLink(warnSpy, '/verify-email?token=');
    warnSpy.mockRestore();

    // callbackURL vem preenchido por padrão (Better Auth manda pra "/") — sucesso é um redirect, não JSON.
    const verifyUrl = link.replace(/^https?:\/\/[^/]+/, '');
    await request(app.getHttpServer()).get(verifyUrl).expect(302);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.emailVerified).toBe(true);
  });

  it('reset de senha: link funciona, revoga sessões antigas e o token não serve de novo', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await request(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .send({ email })
      .expect(200);

    const link = extractLoggedLink(warnSpy, '/reset-password/');
    warnSpy.mockRestore();

    const token = /\/reset-password\/([^?]+)/.exec(link)?.[1];
    expect(token).toBeTruthy();

    const newPassword = 'nova-senha-456';
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword })
      .expect(200);

    // sessão criada no cadastro deve ter sido revogada (revokeSessionsOnPasswordReset)
    await agent.get('/categories').expect(401);

    // token já usado não serve de novo
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'outra-senha-789' })
      .expect(400);

    // login com a senha nova funciona
    const freshAgent = request.agent(app.getHttpServer());
    await freshAgent
      .post('/api/auth/sign-in/email')
      .send({ email, password: newPassword })
      .expect(200);
  });
});

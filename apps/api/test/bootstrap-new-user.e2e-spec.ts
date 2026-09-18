import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { DEFAULT_CATEGORIES } from '../src/categories/default-categories.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { configureApp } from '../src/setup-app.js';

describe('Bootstrap de usuário novo (Fase 13.3)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let userId: string;

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
    const email = `bootstrap-${Date.now()}@teste.local`;
    const res = await agent
      .post('/api/auth/sign-up/email')
      .send({ email, password: 'senha-forte-123', name: email })
      .expect(200);
    userId = res.body.user.id;
  });

  afterAll(async () => {
    await prisma.expense.deleteMany({ where: { userId } });
    await prisma.fixedItem.deleteMany({ where: { userId } });
    await prisma.category.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('cria as categorias padrão', async () => {
    const res = await agent.get('/categories').expect(200);
    expect(res.body).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(res.body.map((c: { name: string }) => c.name).sort()).toEqual(
      [...DEFAULT_CATEGORIES].sort(),
    );
  });

  it('cria os itens fixos de rollup (teto de adicionais e fatura do cartão)', async () => {
    const res = await agent.get('/fixed-items').expect(200);
    const ceiling = res.body.find((i: { role: string }) => i.role === 'ADDITIONAL_CEILING');
    const cardInvoice = res.body.find((i: { role: string }) => i.role === 'CARD_INVOICE');
    expect(ceiling).toBeDefined();
    expect(ceiling.categoryId).toBeTruthy();
    expect(cardInvoice).toBeDefined();
    expect(cardInvoice.categoryId).toBeTruthy();
  });

  it('dashboard e ensure-month funcionam com conta vazia', async () => {
    const ensureMonth = await agent.post('/expenses/ensure-month/2026-09').expect(200);
    expect(ensureMonth.body.created).toBe(2);
    expect(ensureMonth.body.skipped).toEqual([]);

    const summary = await agent.get('/dashboard/summary?month=2026-09').expect(200);
    expect(summary.body.totalSpent).toBe(0);
    expect(summary.body.additionalCeiling).toBe(0);

    const trend = await agent.get('/dashboard/trend?months=1').expect(200);
    expect(trend.body.average).toBe(0);
  });
});

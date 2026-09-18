import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { configureApp } from '../src/setup-app.js';

interface Session {
  agent: ReturnType<typeof request.agent>;
  userId: string;
  email: string;
}

async function signUp(app: INestApplication<App>, email: string): Promise<Session> {
  const agent = request.agent(app.getHttpServer());
  const res = await agent
    .post('/api/auth/sign-up/email')
    .send({ email, password: 'senha-forte-123', name: email })
    .expect(200);
  return { agent, userId: res.body.user.id, email };
}

async function createCategory(session: Session, name: string): Promise<string> {
  const res = await session.agent.post('/categories').send({ name }).expect(201);
  return res.body.id;
}

async function createFixedItem(session: Session, categoryId: string): Promise<string> {
  const res = await session.agent
    .post('/fixed-items')
    .send({ name: 'Aluguel', defaultBudget: 1000, categoryId })
    .expect(201);
  return res.body.id;
}

async function createExpense(session: Session, categoryId: string): Promise<string> {
  const res = await session.agent
    .post('/expenses')
    .send({
      date: '2026-09-01',
      description: 'Mercado',
      amount: 100,
      type: 'ADICIONAL',
      categoryId,
    })
    .expect(201);
  return res.body.id;
}

describe('Isolamento multiusuário (Fase 13.2)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userA: Session;
  let userB: Session;

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

    const suffix = Date.now();
    userA = await signUp(app, `isolamento-a-${suffix}@teste.local`);
    userB = await signUp(app, `isolamento-b-${suffix}@teste.local`);
  });

  afterAll(async () => {
    const ids = [userA.userId, userB.userId];
    await prisma.expense.deleteMany({ where: { userId: { in: ids } } });
    await prisma.fixedItem.deleteMany({ where: { userId: { in: ids } } });
    await prisma.category.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  });

  it('rejeita requisição sem sessão', async () => {
    await request(app.getHttpServer()).get('/categories').expect(401);
  });

  describe('categories', () => {
    let categoryA: string;

    beforeAll(async () => {
      categoryA = await createCategory(userA, 'Casa A');
      await createCategory(userB, 'Casa B');
    });

    it('findAll só devolve categorias do dono', async () => {
      const res = await userB.agent.get('/categories').expect(200);
      expect(res.body.map((c: { id: string }) => c.id)).not.toContain(categoryA);
    });

    it('update/remove de categoria de outro usuário devolve 404', async () => {
      await userB.agent.patch(`/categories/${categoryA}`).send({ name: 'Invadido' }).expect(404);
      await userB.agent.delete(`/categories/${categoryA}`).expect(404);
    });
  });

  describe('fixed-items', () => {
    let categoryA: string;
    let fixedItemA: string;

    beforeAll(async () => {
      categoryA = await createCategory(userA, 'Fixos A');
      fixedItemA = await createFixedItem(userA, categoryA);
    });

    it('findAll só devolve itens fixos do dono', async () => {
      const res = await userB.agent.get('/fixed-items').expect(200);
      expect(res.body.map((f: { id: string }) => f.id)).not.toContain(fixedItemA);
    });

    it('update/remove de item fixo de outro usuário devolve 404', async () => {
      await userB.agent.patch(`/fixed-items/${fixedItemA}`).send({ defaultBudget: 1 }).expect(404);
      await userB.agent.delete(`/fixed-items/${fixedItemA}`).expect(404);
    });

    it('não deixa criar item fixo referenciando categoria de outro usuário', async () => {
      await userB.agent
        .post('/fixed-items')
        .send({ name: 'Invasor', defaultBudget: 1, categoryId: categoryA })
        .expect(404);
    });
  });

  describe('expenses', () => {
    let categoryA: string;
    let fixedItemA: string;
    let expenseA: string;

    beforeAll(async () => {
      categoryA = await createCategory(userA, 'Gastos A');
      fixedItemA = await createFixedItem(userA, categoryA);
      expenseA = await createExpense(userA, categoryA);
    });

    it('findAll só devolve lançamentos do dono', async () => {
      const res = await userB.agent.get('/expenses').expect(200);
      expect(res.body.map((e: { id: string }) => e.id)).not.toContain(expenseA);
    });

    it('update/remove de lançamento de outro usuário devolve 404', async () => {
      await userB.agent.patch(`/expenses/${expenseA}`).send({ amount: 1 }).expect(404);
      await userB.agent.delete(`/expenses/${expenseA}`).expect(404);
    });

    it('não deixa criar lançamento referenciando categoria/item fixo de outro usuário', async () => {
      const ownCategoryB = await createCategory(userB, 'Categoria própria B');
      await userB.agent
        .post('/expenses')
        .send({
          date: '2026-09-01',
          description: 'Invasor',
          amount: 10,
          type: 'ADICIONAL',
          categoryId: categoryA,
        })
        .expect(404);
      await userB.agent
        .post('/expenses')
        .send({
          date: '2026-09-01',
          description: 'Invasor',
          amount: 10,
          budget: 10,
          type: 'FIXO',
          categoryId: ownCategoryB,
          fixedItemId: fixedItemA,
        })
        .expect(404);
    });

    it('ensure-month só cria pendências pros itens fixos do próprio usuário', async () => {
      const res = await userB.agent.post('/expenses/ensure-month/2026-09').expect(200);
      expect(res.body.created).toBe(0);
    });
  });

  describe('dashboard', () => {
    let categoryA: string;

    beforeAll(async () => {
      categoryA = await createCategory(userA, 'Dashboard A');
      await createExpense(userA, categoryA);
    });

    it('summary de B não inclui gastos de A', async () => {
      const res = await userB.agent.get('/dashboard/summary?month=2026-09').expect(200);
      expect(res.body.totalSpent).toBe(0);
    });

    it('trend de B não inclui gastos de A', async () => {
      const res = await userB.agent.get('/dashboard/trend?months=1').expect(200);
      const totalB = res.body.months.reduce(
        (sum: number, m: { total: number }) => sum + m.total,
        0,
      );
      expect(totalB).toBe(0);
    });
  });
});

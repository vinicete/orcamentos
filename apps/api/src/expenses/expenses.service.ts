import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Expense, type TipoLancamento } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service.js';
import { FixedItemsService } from '../fixed-items/fixed-items.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateExpenseDto } from './dto/create-expense.dto.js';
import type { QueryExpensesDto } from './dto/query-expenses.dto.js';
import type { UpdateExpenseDto } from './dto/update-expense.dto.js';

export interface EnsureMonthResult {
  created: number;
  skipped: Array<{ fixedItemId: string; name: string; reason: string }>;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly fixedItems: FixedItemsService,
  ) {}

  findAll(userId: string, query: QueryExpensesDto): Promise<Expense[]> {
    const where: Prisma.ExpenseWhereInput = { userId };

    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.q) where.description = { contains: query.q, mode: 'insensitive' };

    if (query.month) {
      where.date = monthRange(query.month);
    } else if (query.from || query.to) {
      where.date = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOwned(userId: string, id: string): Promise<Expense> {
    const expense = await this.prisma.expense.findFirst({ where: { id, userId } });
    if (!expense) throw new NotFoundException('Lançamento não encontrado');
    return expense;
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    this.assertTypeRules(dto.type, dto.budget, dto.fixedItemId);
    await this.categories.findOne(userId, dto.categoryId);
    if (dto.fixedItemId) await this.fixedItems.findOne(userId, dto.fixedItemId);

    return this.prisma.expense.create({
      data: {
        userId,
        date: new Date(dto.date),
        description: dto.description,
        amount: dto.amount,
        budget: dto.budget,
        type: dto.type,
        categoryId: dto.categoryId,
        fixedItemId: dto.fixedItemId,
        note: dto.note,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const existing = await this.findOwned(userId, id);

    const type = dto.type ?? existing.type;
    const budget =
      dto.budget !== undefined
        ? dto.budget
        : existing.budget !== null
          ? Number(existing.budget)
          : undefined;
    const fixedItemId =
      dto.fixedItemId !== undefined ? dto.fixedItemId : (existing.fixedItemId ?? undefined);
    this.assertTypeRules(type, budget, fixedItemId);

    if (dto.categoryId) await this.categories.findOne(userId, dto.categoryId);
    if (dto.fixedItemId) await this.fixedItems.findOne(userId, dto.fixedItemId);

    // "Pagar pendência": editar o valor de um FIXO pendente marca como realizado
    // (mesma regra do protótipo: status vira 'done' assim que um valor > 0 é digitado).
    const status =
      existing.status === 'PENDENTE' && dto.amount !== undefined
        ? dto.amount > 0
          ? 'REALIZADO'
          : 'PENDENTE'
        : undefined;

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.fixedItemId !== undefined && { fixedItemId: dto.fixedItemId }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(status !== undefined && { status }),
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.expense.delete({ where: { id } });
  }

  /** Cria, pro mês informado, um Expense PENDENTE por FixedItem ativo que ainda não tem lançamento nele. Idempotente. */
  async ensureMonth(userId: string, yyyyMm: string): Promise<EnsureMonthResult> {
    if (!/^\d{4}-\d{2}$/.test(yyyyMm)) {
      throw new BadRequestException('Formato esperado: YYYY-MM');
    }
    const { gte: monthStart, lt: monthEnd } = monthRange(yyyyMm);

    const [activeItems, existing] = await Promise.all([
      this.prisma.fixedItem.findMany({ where: { userId, active: true } }),
      this.prisma.expense.findMany({
        where: {
          userId,
          type: 'FIXO',
          fixedItemId: { not: null },
          date: { gte: monthStart, lt: monthEnd },
        },
        select: { fixedItemId: true },
      }),
    ]);
    const alreadyPresent = new Set(existing.map((e) => e.fixedItemId));

    const toCreate: Prisma.ExpenseCreateManyInput[] = [];
    const skipped: EnsureMonthResult['skipped'] = [];

    for (const item of activeItems) {
      if (alreadyPresent.has(item.id)) continue;
      if (!item.categoryId) {
        skipped.push({ fixedItemId: item.id, name: item.name, reason: 'sem categoria definida' });
        continue;
      }
      toCreate.push({
        userId,
        date: monthStart,
        description: item.name,
        amount: 0,
        budget: item.defaultBudget,
        type: 'FIXO',
        status: 'PENDENTE',
        categoryId: item.categoryId,
        fixedItemId: item.id,
      });
    }

    if (toCreate.length) await this.prisma.expense.createMany({ data: toCreate });
    return { created: toCreate.length, skipped };
  }

  private assertTypeRules(
    type: TipoLancamento,
    budget: number | undefined,
    fixedItemId: string | undefined,
  ) {
    if (type === 'FIXO' && budget === undefined) {
      throw new BadRequestException('Lançamentos do tipo FIXO exigem "budget".');
    }
    if (type === 'ADICIONAL' && budget !== undefined) {
      throw new BadRequestException('Lançamentos do tipo ADICIONAL não aceitam "budget".');
    }
    if (fixedItemId !== undefined && type !== 'FIXO') {
      throw new BadRequestException('"fixedItemId" só é válido para lançamentos do tipo FIXO.');
    }
  }
}

function monthRange(yyyyMm: string): { gte: Date; lt: Date } {
  const [year, month] = yyyyMm.split('-').map(Number);
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  };
}

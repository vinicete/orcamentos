import { Injectable } from '@nestjs/common';
import type { Expense, FixedItem, Category } from '@prisma/client';
import { lastNMonths, monthRange } from '../common/month-range.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  computeSummary,
  computeTrend,
  type DashboardSummary,
  type ExpenseForAgg,
  type TrendResponse,
} from './dashboard.aggregations.js';

type ExpenseWithRelations = Expense & { category: Category; fixedItem: FixedItem | null };

function toAgg(row: ExpenseWithRelations): ExpenseForAgg {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    budget: row.budget !== null ? Number(row.budget) : null,
    type: row.type,
    status: row.status,
    date: row.date,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    fixedItemRole: row.fixedItem?.role ?? null,
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, month: string): Promise<DashboardSummary> {
    const { gte, lt } = monthRange(month);
    const rows = await this.prisma.expense.findMany({
      where: { userId, date: { gte, lt } },
      include: { category: true, fixedItem: true },
    });
    return computeSummary(month, rows.map(toAgg));
  }

  async trend(userId: string, months: number): Promise<TrendResponse> {
    const monthList = lastNMonths(months);
    const { gte } = monthRange(monthList[0]);

    const rows = await this.prisma.expense.findMany({
      where: { userId, date: { gte } },
      include: { category: true, fixedItem: true },
    });

    const expensesByMonth = new Map<string, ExpenseForAgg[]>();
    for (const row of rows.map(toAgg)) {
      const key = row.date.toISOString().slice(0, 7);
      const list = expensesByMonth.get(key) ?? [];
      list.push(row);
      expensesByMonth.set(key, list);
    }

    return computeTrend(monthList, expensesByMonth);
  }
}

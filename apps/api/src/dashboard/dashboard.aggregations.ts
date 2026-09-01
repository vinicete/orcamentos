import type { FixedItemRole, StatusLancamento, TipoLancamento } from '@prisma/client';

/** Formato "achatado" de um Expense que as funções de agregação precisam — já com o
 * nome da categoria e o role do FixedItem resolvidos, pra não depender do Prisma aqui. */
export interface ExpenseForAgg {
  id: string;
  description: string;
  amount: number;
  budget: number | null;
  type: TipoLancamento;
  status: StatusLancamento;
  date: Date;
  categoryId: string;
  categoryName: string;
  fixedItemRole: FixedItemRole | null;
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  total: number;
  pct: number;
}

export interface TopExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryName: string;
  type: TipoLancamento;
}

export interface FixedItemRow {
  id: string;
  description: string;
  budget: number | null;
  amount: number;
  status: StatusLancamento;
  delta: number | null;
}

export interface PendingItem {
  id: string;
  description: string;
  budget: number | null;
}

export interface DashboardSummary {
  month: string;
  totalSpent: number;
  totalBudget: number;
  budgetPct: number;
  additionalSpent: number;
  additionalCeiling: number;
  additionalPct: number;
  cardTotal: number;
  cardPurchaseCount: number;
  entryCount: number;
  pendingCount: number;
  categories: CategoryTotal[];
  topExpenses: TopExpense[];
  fixedItems: FixedItemRow[];
  pending: PendingItem[];
}

export interface TrendMonth {
  month: string;
  total: number;
  byCategory: Array<{ categoryId: string; name: string; total: number }>;
}

export interface TrendResponse {
  months: TrendMonth[];
  average: number;
}

const TOP_EXPENSES_LIMIT = 7;

// docs/PLANO_IMPLEMENTACAO.md §0.3 — mas via FixedItem.role, não regex na descrição
// (essa é a diferença deliberada em relação ao protótipo: ver §0.4 do plano).
const isCeiling = (e: ExpenseForAgg) =>
  e.type === 'FIXO' && e.fixedItemRole === 'ADDITIONAL_CEILING';
const isRollup = (e: ExpenseForAgg) =>
  e.type === 'FIXO' &&
  (e.fixedItemRole === 'ADDITIONAL_CEILING' || e.fixedItemRole === 'CARD_INVOICE');

function sumAmount(list: ExpenseForAgg[]): number {
  return list.reduce((total, e) => total + e.amount, 0);
}

function sumByCategory(list: ExpenseForAgg[]): Map<string, { name: string; total: number }> {
  const byCategory = new Map<string, { name: string; total: number }>();
  for (const e of list) {
    const entry = byCategory.get(e.categoryId) ?? { name: e.categoryName, total: 0 };
    entry.total += e.amount;
    byCategory.set(e.categoryId, entry);
  }
  return byCategory;
}

/**
 * Agrega os lançamentos de um único mês nos números do rail/KPIs do dashboard.
 *
 * Regime de competência: cartão conta no mês em que a compra aconteceu (não no
 * mês da fatura). As linhas de rollup (teto de adicionais e fatura do cartão)
 * não entram na quebra por categoria nem no top de gastos — são agregados
 * derivados dos próprios lançamentos individuais, contá-las de novo seria
 * dobrar a conta. O teto em si também não entra no "gasto do mês" (só o valor
 * realmente gasto em Adicionais conta), mas o orçamento dele entra no total
 * orçado — mesma lógica da planilha original.
 */
export function computeSummary(month: string, expenses: ExpenseForAgg[]): DashboardSummary {
  const fixed = expenses.filter((e) => e.type === 'FIXO');
  const additional = expenses.filter((e) => e.type === 'ADICIONAL');
  const card = expenses.filter((e) => e.type === 'CARTAO');

  const fixedExcludingCeiling = fixed.filter((e) => !isCeiling(e));
  const totalSpent = sumAmount(fixedExcludingCeiling) + sumAmount(additional);
  const totalBudget = fixed.reduce((total, e) => total + (e.budget ?? 0), 0);

  const ceilingItem = fixed.find(isCeiling);
  const additionalCeiling = ceilingItem?.budget ?? 0;
  const additionalSpent = sumAmount(additional);

  const cardTotal = sumAmount(card);

  const accrual = expenses.filter((e) => !isRollup(e));
  const byCategory = sumByCategory(accrual);
  const categoryGrandTotal = [...byCategory.values()].reduce((s, c) => s + c.total, 0) || 1;
  const categories: CategoryTotal[] = [...byCategory.entries()]
    .map(([categoryId, c]) => ({
      categoryId,
      name: c.name,
      total: c.total,
      pct: c.total / categoryGrandTotal,
    }))
    .sort((a, b) => b.total - a.total);

  const topExpenses: TopExpense[] = [...accrual]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_EXPENSES_LIMIT)
    .map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date.toISOString().slice(0, 10),
      categoryName: e.categoryName,
      type: e.type,
    }));

  const fixedItems: FixedItemRow[] = fixed.map((e) => ({
    id: e.id,
    description: e.description,
    budget: e.budget,
    amount: e.amount,
    status: e.status,
    delta: e.status === 'PENDENTE' ? null : (e.budget ?? 0) - e.amount,
  }));

  const pending: PendingItem[] = fixed
    .filter((e) => e.status === 'PENDENTE')
    .map((e) => ({ id: e.id, description: e.description, budget: e.budget }));

  return {
    month,
    totalSpent,
    totalBudget,
    budgetPct: totalBudget ? totalSpent / totalBudget : 0,
    additionalSpent,
    additionalCeiling,
    additionalPct: additionalCeiling ? additionalSpent / additionalCeiling : 0,
    cardTotal,
    cardPurchaseCount: card.length,
    entryCount: expenses.length,
    pendingCount: pending.length,
    categories,
    topExpenses,
    fixedItems,
    pending,
  };
}

/** Série categoria×mês (barra empilhada) e total×mês (linha), pra janela de `months`. */
export function computeTrend(
  months: string[],
  expensesByMonth: Map<string, ExpenseForAgg[]>,
): TrendResponse {
  const result: TrendMonth[] = months.map((month) => {
    const accrual = (expensesByMonth.get(month) ?? []).filter((e) => !isRollup(e));
    const byCategory = sumByCategory(accrual);
    return {
      month,
      total: sumAmount(accrual),
      byCategory: [...byCategory.entries()]
        .map(([categoryId, c]) => ({ categoryId, name: c.name, total: c.total }))
        .sort((a, b) => b.total - a.total),
    };
  });

  const average = result.length ? result.reduce((s, m) => s + m.total, 0) / result.length : 0;
  return { months: result, average };
}

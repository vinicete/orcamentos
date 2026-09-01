// Espelha o contrato real da API (apps/api) — não importa de lá (packages/shared
// não depende de nenhum app) porque isso é referência de contrato, não código
// compartilhado de fato. Campos Decimal do Prisma (amount/budget/defaultBudget)
// chegam como STRING no JSON de resposta; os endpoints de dashboard, que já
// fazem a agregação em JS puro, devolvem `number` de verdade.

export type TipoLancamento = 'FIXO' | 'ADICIONAL' | 'CARTAO';
export type StatusLancamento = 'PENDENTE' | 'REALIZADO';
export type FixedItemRole = 'NORMAL' | 'ADDITIONAL_CEILING' | 'CARD_INVOICE';

export interface PublicUser {
  id: string;
  email: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  order: number;
}

export interface FixedItem {
  id: string;
  userId: string;
  name: string;
  defaultBudget: string;
  role: FixedItemRole;
  categoryId: string | null;
  active: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: string;
  budget: string | null;
  type: TipoLancamento;
  status: StatusLancamento;
  categoryId: string;
  fixedItemId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  order?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CreateFixedItemInput {
  name: string;
  defaultBudget: number;
  role?: FixedItemRole;
  categoryId?: string;
  active?: boolean;
}

export type UpdateFixedItemInput = Partial<CreateFixedItemInput>;

export interface CreateExpenseInput {
  date: string;
  description: string;
  amount: number;
  budget?: number;
  type: TipoLancamento;
  categoryId: string;
  fixedItemId?: string;
  note?: string;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseFilters {
  month?: string;
  type?: TipoLancamento;
  categoryId?: string;
  from?: string;
  to?: string;
  q?: string;
}

export interface EnsureMonthResult {
  created: number;
  skipped: Array<{ fixedItemId: string; name: string; reason: string }>;
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

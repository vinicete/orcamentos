import type {
  Category,
  CreateCategoryInput,
  CreateExpenseInput,
  CreateFixedItemInput,
  DashboardSummary,
  EnsureMonthResult,
  Expense,
  ExpenseFilters,
  FixedItem,
  PublicUser,
  TrendResponse,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdateFixedItemInput,
} from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Nest devolve `message` como string OU array de strings (várias falhas do ValidationPipe). */
function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg.every((m) => typeof m === 'string')) return msg.join(', ');
  }
  return fallback;
}

export interface ApiClientOptions {
  baseUrl: string;
}

/** Cliente HTTP tipado pra API (apps/api). Sessão via cookie httpOnly — sempre `credentials: 'include'`. */
export class ApiClient {
  private readonly baseUrl: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = undefined;
      }
      throw new ApiError(
        res.status,
        extractMessage(body, res.statusText || 'Erro inesperado'),
        body,
      );
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }
  private post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  private patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  private del<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Auth
  login(email: string, password: string) {
    return this.post<PublicUser>('/auth/login', { email, password });
  }
  logout() {
    return this.post<{ ok: boolean }>('/auth/logout');
  }
  refresh() {
    return this.post<PublicUser>('/auth/refresh');
  }
  me() {
    return this.get<PublicUser>('/auth/me');
  }

  // Categories
  getCategories() {
    return this.get<Category[]>('/categories');
  }
  createCategory(input: CreateCategoryInput) {
    return this.post<Category>('/categories', input);
  }
  updateCategory(id: string, input: UpdateCategoryInput) {
    return this.patch<Category>(`/categories/${id}`, input);
  }
  deleteCategory(id: string) {
    return this.del<void>(`/categories/${id}`);
  }

  // Fixed items
  getFixedItems() {
    return this.get<FixedItem[]>('/fixed-items');
  }
  createFixedItem(input: CreateFixedItemInput) {
    return this.post<FixedItem>('/fixed-items', input);
  }
  updateFixedItem(id: string, input: UpdateFixedItemInput) {
    return this.patch<FixedItem>(`/fixed-items/${id}`, input);
  }
  deleteFixedItem(id: string) {
    return this.del<void>(`/fixed-items/${id}`);
  }

  // Expenses
  getExpenses(filters: ExpenseFilters = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    const qs = params.toString();
    return this.get<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
  }
  createExpense(input: CreateExpenseInput) {
    return this.post<Expense>('/expenses', input);
  }
  updateExpense(id: string, input: UpdateExpenseInput) {
    return this.patch<Expense>(`/expenses/${id}`, input);
  }
  deleteExpense(id: string) {
    return this.del<void>(`/expenses/${id}`);
  }
  ensureMonth(yyyyMm: string) {
    return this.post<EnsureMonthResult>(`/expenses/ensure-month/${yyyyMm}`);
  }

  // Dashboard
  getDashboardSummary(month: string) {
    return this.get<DashboardSummary>(`/dashboard/summary?month=${encodeURIComponent(month)}`);
  }
  getDashboardTrend(months?: number) {
    return this.get<TrendResponse>(`/dashboard/trend${months ? `?months=${months}` : ''}`);
  }
}

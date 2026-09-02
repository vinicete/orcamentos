'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  ApiError,
  formatCurrency,
  formatDayMonth,
  getCategoryColor,
  parseAmount,
  type Category,
  type Expense,
} from '@orcamento/shared';
import { api } from '@/lib/api-client';
import { useConfirmDialog } from '@/lib/confirm-context';

interface EditForm {
  date: string;
  description: string;
  amount: string;
  budget: string;
  categoryId: string;
}

function toEditForm(expense: Expense): EditForm {
  const pendingZero = expense.status === 'PENDENTE' && Number(expense.amount) === 0;
  return {
    date: expense.date.slice(0, 10),
    description: expense.description,
    amount: pendingZero ? '' : expense.amount,
    budget: expense.budget ?? '',
    categoryId: expense.categoryId,
  };
}

export function EntryRow({
  expense,
  categories,
  onChanged,
}: {
  expense: Expense;
  categories: Category[];
  onChanged: () => void;
}) {
  const { confirm } = useConfirmDialog();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(() => toEditForm(expense));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === expense.categoryId);
  const isPending = expense.status === 'PENDENTE';

  function startEdit() {
    setForm(toEditForm(expense));
    setError(null);
    setEditing(true);
  }

  async function save() {
    setError(null);
    const description = form.description.trim();
    const amount = parseAmount(form.amount);
    if (!description) {
      setError('Descrição é obrigatória.');
      return;
    }
    if (amount <= 0) {
      setError('Valor precisa ser maior que zero.');
      return;
    }

    setSaving(true);
    try {
      await api.updateExpense(expense.id, {
        date: form.date,
        description,
        amount,
        categoryId: form.categoryId,
        ...(expense.type !== 'ADICIONAL' && { budget: parseAmount(form.budget) }),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!(await confirm(`Excluir "${expense.description}"?`))) return;
    await api.deleteExpense(expense.id);
    onChanged();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <div className="border-b-2 border-accent py-2">
        <div className="flex flex-wrap items-center gap-2" onKeyDown={onKeyDown}>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="min-h-9 w-32 border border-divider bg-surface px-2 text-xs text-text"
          />
          <input
            autoFocus
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="min-h-9 min-w-32 flex-1 border border-divider bg-surface px-2 text-sm text-text"
          />
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="min-h-9 border border-divider bg-surface px-2 text-sm text-text"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {expense.type !== 'ADICIONAL' && (
            <input
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              placeholder="orçado"
              className="min-h-9 w-24 border border-divider bg-surface px-2 text-right text-sm text-text"
            />
          )}
          <input
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0,00"
            className="min-h-9 w-24 border border-divider bg-surface px-2 text-right text-sm font-bold text-text"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="min-h-9 cursor-pointer bg-accent px-3 text-xs font-heading font-bold text-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-9 cursor-pointer px-2 text-xs text-neutral-700"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] text-accent-700">{error}</p>}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') startEdit();
      }}
      className="flex cursor-pointer items-center gap-3 border-b border-divider py-2.5 text-sm hover:bg-surface"
    >
      <span className="w-10 shrink-0 text-xs text-neutral-700">{formatDayMonth(expense.date)}</span>
      <span
        className="size-2.5 shrink-0"
        style={{ backgroundColor: category ? getCategoryColor(category.order) : undefined }}
      />
      <span className="min-w-0 flex-1 truncate">{expense.description}</span>
      <span className="hidden shrink-0 text-xs text-neutral-700 sm:block">{category?.name}</span>
      {isPending ? (
        <span className="w-24 shrink-0 text-right text-xs text-neutral-700 uppercase">
          — <span className="block text-[9px] tracking-[.06em]">pendente</span>
        </span>
      ) : (
        <span className="w-24 shrink-0 text-right font-bold">
          {formatCurrency(Number(expense.amount))}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          remove();
        }}
        aria-label="Excluir lançamento"
        className="shrink-0 cursor-pointer px-1 text-neutral-700 hover:text-accent"
      >
        ×
      </button>
    </div>
  );
}

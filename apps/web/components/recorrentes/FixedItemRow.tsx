'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  ApiError,
  formatCurrency,
  parseAmount,
  type Category,
  type FixedItem,
  type FixedItemRole,
} from '@orcamento/shared';
import { api } from '@/lib/api-client';
import { useConfirmDialog } from '@/lib/confirm-context';

const ROLE_LABEL: Record<FixedItemRole, string> = {
  NORMAL: 'Normal',
  ADDITIONAL_CEILING: 'Teto de adicionais',
  CARD_INVOICE: 'Fatura do cartão',
};

interface EditForm {
  name: string;
  budget: string;
  categoryId: string;
  role: FixedItemRole;
}

function toForm(item: FixedItem): EditForm {
  return {
    name: item.name,
    budget: item.defaultBudget,
    categoryId: item.categoryId ?? '',
    role: item.role,
  };
}

export function FixedItemRow({
  item,
  categories,
  hasCeiling,
  hasCardInvoice,
  onChanged,
}: {
  item: FixedItem;
  categories: Category[];
  hasCeiling: boolean;
  hasCardInvoice: boolean;
  onChanged: () => void;
}) {
  const { confirm, alert } = useConfirmDialog();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === item.categoryId);

  function startEdit() {
    setForm(toForm(item));
    setError(null);
    setEditing(true);
  }

  async function save() {
    const name = form.name.trim();
    if (!name) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateFixedItem(item.id, {
        name,
        defaultBudget: parseAmount(form.budget),
        role: form.role,
        categoryId: form.categoryId || undefined,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    try {
      await api.updateFixedItem(item.id, { active: !item.active });
      onChanged();
    } catch (err) {
      await alert(err instanceof ApiError ? err.message : 'Não foi possível atualizar.');
    }
  }

  async function remove() {
    if (!(await confirm(`Excluir "${item.name}"?`))) return;
    try {
      await api.deleteFixedItem(item.id);
      onChanged();
    } catch (err) {
      await alert(err instanceof ApiError ? err.message : 'Não foi possível excluir.');
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    // Papel de teto/fatura é usado como singleton nos cálculos do dashboard (§0.3) — a API não
    // impede duplicar, então avisamos aqui pra evitar o usuário criar um segundo sem perceber
    // que só o primeiro entraria na conta.
    const showRoleWarning =
      (form.role === 'ADDITIONAL_CEILING' && hasCeiling && item.role !== 'ADDITIONAL_CEILING') ||
      (form.role === 'CARD_INVOICE' && hasCardInvoice && item.role !== 'CARD_INVOICE');

    return (
      <div className="border-b-2 border-accent py-2">
        <div className="flex flex-wrap items-center gap-2" onKeyDown={onKeyDown}>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="min-h-9 min-w-32 flex-1 border border-divider bg-surface px-2 text-sm text-text"
          />
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="min-h-9 border border-divider bg-surface px-2 text-sm text-text"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={form.budget}
            onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            placeholder="0,00"
            className="min-h-9 w-24 border border-divider bg-surface px-2 text-right text-sm font-bold text-text"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as FixedItemRole }))}
            className="min-h-9 border border-divider bg-surface px-2 text-sm text-text"
          >
            <option value="NORMAL">Normal</option>
            <option value="ADDITIONAL_CEILING">Teto de adicionais</option>
            <option value="CARD_INVOICE">Fatura do cartão</option>
          </select>
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
        {showRoleWarning && (
          <p className="mt-1 text-[11px] text-accent-700">
            Já existe outro item com esse papel — só o primeiro entra nos cálculos do dashboard.
          </p>
        )}
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
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
      <span className="hidden shrink-0 text-xs text-neutral-700 sm:block">
        {category?.name ?? '—'}
      </span>
      {item.role !== 'NORMAL' && (
        <span className="shrink-0 text-[10px] tracking-[.04em] text-neutral-700 uppercase">
          {ROLE_LABEL[item.role]}
        </span>
      )}
      <span className="w-20 shrink-0 text-right font-bold">
        {formatCurrency(Number(item.defaultBudget))}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleActive();
        }}
        className={`shrink-0 text-[10px] tracking-[.04em] uppercase ${
          item.active ? 'text-text' : 'text-neutral-700'
        }`}
      >
        {item.active ? 'ativo' : 'inativo'}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          remove();
        }}
        aria-label="Excluir item fixo"
        className="shrink-0 cursor-pointer px-1 text-neutral-700 hover:text-accent"
      >
        ×
      </button>
    </div>
  );
}

import {
  ApiError,
  formatCurrency,
  parseAmount,
  type Category,
  type DashboardSummary,
  type FixedItem,
  type TipoLancamento,
} from '@orcamento/shared';
import { useEffect, useState } from 'react';
import { api } from './api-client';

export interface ExpenseDraft {
  type: TipoLancamento;
  description: string;
  amount: string;
  budget: string;
  categoryId: string;
  date: string;
  fixedItemId?: string;
}

const TYPE_LABEL: Record<TipoLancamento, string> = {
  FIXO: 'Fixo',
  ADICIONAL: 'Adicional',
  CARTAO: 'Cartão',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialDraft(): ExpenseDraft {
  return {
    type: 'ADICIONAL',
    description: '',
    amount: '',
    budget: '',
    categoryId: '',
    date: todayIso(),
  };
}

function contextualHint(draft: ExpenseDraft, summary: DashboardSummary | null): string {
  if (!summary) return '';
  if (draft.type === 'ADICIONAL') {
    return `Adicionais até agora: ${formatCurrency(summary.additionalSpent)} de ${formatCurrency(summary.additionalCeiling)} de teto.`;
  }
  if (draft.type === 'CARTAO') {
    return `Cartão até agora: ${formatCurrency(summary.cardTotal)} — vira a fatura do mês que vem.`;
  }
  return draft.fixedItemId
    ? 'Orçado preenchido a partir do item fixo cadastrado.'
    : 'Fixo exige orçado. Digite um nome já cadastrado pra preencher sozinho.';
}

/** Estado de rascunho compartilhado entre QuickEntryRow (desktop) e QuickEntrySheet (mobile). */
export function useExpenseDraft(month: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [draft, setDraft] = useState<ExpenseDraft>(initialDraft);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Só é true antes do primeiro carregamento — trocar de mês não volta a mostrar "Carregando…"
  // (evita o flash; a lista antiga fica visível até a nova chegar).
  const loading = categories.length === 0;

  useEffect(() => {
    let ignore = false;
    Promise.all([api.getCategories(), api.getFixedItems(), api.getDashboardSummary(month)]).then(
      ([cats, items, sum]) => {
        if (ignore) return;
        setCategories(cats);
        setFixedItems(items);
        setSummary(sum);
        setDraft((d) => (d.categoryId ? d : { ...d, categoryId: cats[0]?.id ?? '' }));
      },
    );
    return () => {
      ignore = true;
    };
  }, [month]);

  function setField<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) {
    setError(null);
    setSavedMessage(null);
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === 'type') {
        next.fixedItemId = undefined;
        if (value !== 'FIXO') next.budget = '';
      }
      if (key === 'description' && next.type === 'FIXO') {
        const match = fixedItems.find(
          (fi) => fi.name.toLowerCase() === String(value).trim().toLowerCase(),
        );
        if (match) {
          next.budget = match.defaultBudget;
          next.fixedItemId = match.id;
          if (match.categoryId) next.categoryId = match.categoryId;
        } else {
          next.fixedItemId = undefined;
        }
      }
      return next;
    });
  }

  async function submit() {
    setError(null);
    const description = draft.description.trim();
    const amount = parseAmount(draft.amount);
    if (!description) {
      setError('Descrição é obrigatória.');
      return;
    }
    if (amount <= 0) {
      setError('Valor precisa ser maior que zero.');
      return;
    }
    if (!draft.categoryId) {
      setError('Escolha uma categoria.');
      return;
    }

    let budget: number | undefined;
    if (draft.type === 'FIXO') {
      budget = parseAmount(draft.budget);
      if (!budget) {
        setError('Fixo exige orçado.');
        return;
      }
    } else if (draft.type === 'CARTAO' && draft.budget.trim()) {
      budget = parseAmount(draft.budget);
    }

    setSaving(true);
    try {
      await api.createExpense({
        date: draft.date,
        description,
        amount,
        budget,
        type: draft.type,
        categoryId: draft.categoryId,
        fixedItemId: draft.fixedItemId,
      });
      setSavedMessage(`${TYPE_LABEL[draft.type]} salvo — ${formatCurrency(amount)}`);
      setDraft((d) => ({ ...d, description: '', amount: '', budget: '', fixedItemId: undefined }));
      setSummary(await api.getDashboardSummary(month));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  }

  return {
    categories,
    fixedItems,
    summary,
    draft,
    setField,
    submit,
    saving,
    loading,
    error,
    hint: savedMessage ?? contextualHint(draft, summary),
  };
}

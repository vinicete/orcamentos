'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  formatCurrency,
  monthShortLabel,
  type Category,
  type Expense,
  type TipoLancamento,
} from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';
import { EntryFilters } from './EntryFilters';
import { EntryRow } from './EntryRow';

export function EntryList({
  month,
  categories,
  refreshKey,
  onChanged,
}: {
  month: string;
  categories: Category[];
  refreshKey: number;
  onChanged: () => void;
}) {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState<TipoLancamento | ''>('');
  const [categoryId, setCategoryId] = useState('');

  // Debounce simples: evita um GET por tecla digitada na busca.
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    let ignore = false;
    api
      .getExpenses({
        month,
        q: q || undefined,
        type: type || undefined,
        categoryId: categoryId || undefined,
      })
      .then((data) => {
        if (ignore) return;
        setError(null);
        setExpenses(data);
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof ApiError ? err.message : 'Não foi possível carregar os lançamentos.',
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, [month, q, type, categoryId, refreshKey]);

  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <EntryFilters
        categories={categories}
        q={qInput}
        onQChange={setQInput}
        type={type}
        onTypeChange={setType}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      <div className="mb-2 flex items-baseline justify-between border-b-2 border-text pb-1.5">
        <SectionLabel>
          {error
            ? 'Erro ao carregar'
            : expenses
              ? `${expenses.length} lançamento${expenses.length === 1 ? '' : 's'} · ${monthShortLabel(month)}`
              : 'Carregando…'}
        </SectionLabel>
        {!error && <span className="font-heading text-sm font-bold">{formatCurrency(total)}</span>}
      </div>

      {error && <p className="py-6 text-center text-sm text-accent-700">{error}</p>}

      {!error && expenses?.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-700">Nenhum lançamento encontrado.</p>
      )}

      {!error &&
        expenses?.map((expense) => (
          <EntryRow
            key={expense.id}
            expense={expense}
            categories={categories}
            onChanged={onChanged}
          />
        ))}
    </div>
  );
}

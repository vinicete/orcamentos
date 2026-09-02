'use client';

import type { KeyboardEvent } from 'react';
import { CategorySelect } from './CategorySelect';
import { TypeSegmented } from './TypeSegmented';
import type { useExpenseDraft } from '@/lib/use-expense-draft';

type Draft = ReturnType<typeof useExpenseDraft>;

export function QuickEntryRow({ draft: d }: { draft: Draft }) {
  const { draft, categories, setField, submit, saving, error, hint } = d;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div className="mb-6 border-2 border-text p-4">
      <div className="mb-3 flex items-baseline gap-3">
        <h6 className="font-heading text-[13px] tracking-[.08em] text-accent uppercase">
          Novo lançamento
        </h6>
        <span className="text-[11px] tracking-[.04em] text-neutral-700">
          Tipo primeiro — depois é uma linha e Enter.
        </span>
      </div>

      <TypeSegmented
        value={draft.type}
        onChange={(type) => setField('type', type)}
        className="mb-3 w-fit"
      />

      <div className="flex flex-wrap items-end gap-2.5">
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Descrição
          </label>
          <input
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="uber isa"
            className="min-h-10 w-full border border-divider bg-surface px-2.5 py-2 text-sm text-text"
          />
        </div>

        <div className="w-32">
          <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Valor
          </label>
          <input
            value={draft.amount}
            onChange={(e) => setField('amount', e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="0,00"
            className="min-h-10 w-full border border-divider bg-surface px-2.5 py-2 text-sm font-bold text-text"
          />
        </div>

        {draft.type !== 'ADICIONAL' && (
          <div className="w-32">
            <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
              {draft.type === 'FIXO' ? 'Orçado' : 'Orçado (opc.)'}
            </label>
            <input
              value={draft.budget}
              onChange={(e) => setField('budget', e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="0,00"
              className="min-h-10 w-full border border-divider bg-surface px-2.5 py-2 text-sm text-text"
            />
          </div>
        )}

        <div className="w-40">
          <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Categoria
          </label>
          <CategorySelect
            categories={categories}
            value={draft.categoryId}
            onChange={(categoryId) => setField('categoryId', categoryId)}
          />
        </div>

        <div className="w-36">
          <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Data
          </label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setField('date', e.target.value)}
            className="min-h-10 w-full border border-divider bg-surface px-2.5 py-2 text-sm text-text"
          />
        </div>

        <button
          type="button"
          onClick={() => submit()}
          disabled={saving}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center bg-accent px-3.5 text-[13px] font-heading font-bold text-bg hover:bg-accent-600 active:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? '...' : 'ADD ↵'}
        </button>
      </div>

      <div className="mt-2.5 min-h-4 text-[11px] text-accent-700">{error ?? hint}</div>
    </div>
  );
}

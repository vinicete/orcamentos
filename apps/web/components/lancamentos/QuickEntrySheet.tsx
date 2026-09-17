'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { useExpenseDraft } from '@/lib/use-expense-draft';
import { CategoryChips } from './CategoryChips';
import { TypeSegmented } from './TypeSegmented';

type Draft = ReturnType<typeof useExpenseDraft>;

export function QuickEntrySheet({ draft: d }: { draft: Draft }) {
  const [open, setOpen] = useState(false);
  const { draft, categories, setField, submit, saving, error, hint } = d;
  const message = error ?? hint;

  async function onSave() {
    await submit();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Novo lançamento"
        className="fixed right-5 bottom-5 z-40 flex size-14 cursor-pointer items-center justify-center bg-accent text-3xl font-bold text-bg shadow-lg hover:bg-accent-600 md:hidden"
      >
        +
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-4">
          <SheetHeader className="p-0 pb-2.5">
            <SheetTitle className="font-heading text-[13px] tracking-[.08em] text-accent uppercase">
              Novo lançamento
            </SheetTitle>
          </SheetHeader>

          <TypeSegmented
            value={draft.type}
            onChange={(type) => setField('type', type)}
            className="mb-3"
          />

          <div className="mb-3 flex gap-2.5">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
                Valor
              </label>
              <input
                value={draft.amount}
                onChange={(e) => setField('amount', e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                className="min-h-13 w-full border border-divider bg-surface px-3 py-2 text-2xl font-bold tracking-[-.02em] text-text"
              />
            </div>
            {draft.type !== 'ADICIONAL' && (
              <div className="w-28">
                <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
                  {draft.type === 'FIXO' ? 'Orçado' : 'Orçado (opc.)'}
                </label>
                <input
                  value={draft.budget}
                  onChange={(e) => setField('budget', e.target.value)}
                  placeholder="0,00"
                  className="min-h-13 w-full border border-divider bg-surface px-3 py-2.5 text-base text-text"
                />
              </div>
            )}
          </div>

          <label className="mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Descrição
          </label>
          <input
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="uber isa"
            className="mb-3 min-h-11 w-full border border-divider bg-surface px-3 py-2.5 text-base text-text"
          />

          <label className="mb-1.5 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Categoria
          </label>
          <CategoryChips
            categories={categories}
            value={draft.categoryId}
            onChange={(categoryId) => setField('categoryId', categoryId)}
          />

          <label className="mt-3 mb-1 block text-[10px] tracking-[.1em] text-neutral-700 uppercase">
            Data
          </label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setField('date', e.target.value)}
            className="mb-2 min-h-11 w-full border border-divider bg-surface px-3 py-2.5 text-[15px] text-text"
          />

          {message && <div className="mb-2 text-[11px] text-accent-700">{message}</div>}

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex min-h-12 w-full cursor-pointer items-center justify-start bg-accent px-4 text-[15px] font-heading font-bold text-bg active:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'SALVANDO…' : 'SALVAR LANÇAMENTO'}
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}

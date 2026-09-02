'use client';

import { useExpenseDraft } from '@/lib/use-expense-draft';
import { QuickEntryRow } from './QuickEntryRow';
import { QuickEntrySheet } from './QuickEntrySheet';

export function NewExpensePanel({ month, onSaved }: { month: string; onSaved?: () => void }) {
  const draft = useExpenseDraft(month, onSaved);

  if (draft.loading) {
    return <div className="mb-6 text-sm text-neutral-700">Carregando…</div>;
  }

  return (
    <>
      <div className="hidden md:block">
        <QuickEntryRow draft={draft} />
      </div>
      <QuickEntrySheet draft={draft} />
    </>
  );
}

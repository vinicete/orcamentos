'use client';

import { useState } from 'react';
import { parseAmount, type PendingItem } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';

/** Rail lateral: quitar um fixo pendente digitando o valor direto, sem abrir form (§4.2). */
export function PendingFixedList({ items, onPaid }: { items: PendingItem[]; onPaid: () => void }) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  function startPay(item: PendingItem) {
    setPayingId(item.id);
    setValue(item.budget !== null ? String(item.budget) : '');
  }

  async function confirmPay(id: string) {
    const amount = parseAmount(value);
    if (amount <= 0) return;
    setSaving(true);
    try {
      await api.updateExpense(id, { amount });
      setPayingId(null);
      setValue('');
      onPaid();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-2 border-text p-4">
      <SectionLabel className="text-accent">Fixos pendentes</SectionLabel>
      <ul className="mt-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 border-b border-divider py-2 text-sm last:border-b-0"
          >
            <span className="min-w-0 flex-1 truncate">{item.description}</span>
            {payingId === item.id ? (
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmPay(item.id);
                  if (e.key === 'Escape') setPayingId(null);
                }}
                onBlur={() => !saving && setPayingId(null)}
                disabled={saving}
                placeholder="0,00"
                className="w-24 border border-divider bg-surface px-2 py-1 text-right text-sm text-text"
              />
            ) : (
              <button
                type="button"
                onClick={() => startPay(item)}
                className="shrink-0 text-xs tracking-[.04em] text-neutral-700 uppercase underline decoration-dotted"
              >
                pendente
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

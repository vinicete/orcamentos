'use client';

import { useEffect, useState } from 'react';
import { ApiError, formatCurrency, type DashboardSummary } from '@orcamento/shared';
import { MeterBar } from '@/components/ui/meter-bar';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';
import { PendingFixedList } from './PendingFixedList';

export function SummaryRail({
  month,
  refreshKey,
  onChanged,
  className = '',
}: {
  month: string;
  refreshKey: number;
  onChanged: () => void;
  className?: string;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .getDashboardSummary(month)
      .then((s) => {
        if (ignore) return;
        setError(null);
        setSummary(s);
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o resumo.');
        }
      });
    return () => {
      ignore = true;
    };
  }, [month, refreshKey]);

  if (error) {
    return (
      <aside className={className}>
        <p className="border-2 border-accent-700 p-3 text-xs text-accent-700">{error}</p>
      </aside>
    );
  }

  if (!summary) return <aside className={className} />;

  return (
    <aside className={className}>
      <div className="mb-4 border-2 border-text p-4">
        <SectionLabel className="text-accent">Total x orçado</SectionLabel>
        <div className="mt-1.5 font-heading text-2xl font-bold">
          {formatCurrency(summary.totalSpent)}
        </div>
        <div className="mb-2 text-xs text-neutral-700">
          de {formatCurrency(summary.totalBudget)}
        </div>
        <MeterBar value={summary.totalSpent} max={summary.totalBudget} />
      </div>

      <div className="mb-4 border-2 border-text p-4">
        <SectionLabel className="text-accent">Teto de adicionais</SectionLabel>
        <div className="mt-1.5 font-heading text-2xl font-bold">
          {formatCurrency(summary.additionalSpent)}
        </div>
        <div className="mb-2 text-xs text-neutral-700">
          de {formatCurrency(summary.additionalCeiling)}
        </div>
        <MeterBar value={summary.additionalSpent} max={summary.additionalCeiling} />
      </div>

      <div className="mb-4 border-2 border-text p-4">
        <SectionLabel className="text-accent">Cartão acumulado</SectionLabel>
        <div className="mt-1.5 font-heading text-2xl font-bold">
          {formatCurrency(summary.cardTotal)}
        </div>
        <div className="text-xs text-neutral-700">
          {summary.cardPurchaseCount} compra{summary.cardPurchaseCount === 1 ? '' : 's'} — vira a
          fatura do mês que vem
        </div>
      </div>

      {summary.pending.length > 0 && (
        <PendingFixedList items={summary.pending} onPaid={onChanged} />
      )}
    </aside>
  );
}

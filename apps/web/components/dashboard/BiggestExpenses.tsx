import { formatCurrency, formatDayMonth, type TopExpense } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';

export function BiggestExpenses({ items }: { items: TopExpense[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 border-2 border-text p-4">
      <SectionLabel className="mb-3 text-accent">Maiores gastos</SectionLabel>
      <div>
        {items.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 border-b border-divider py-2 text-sm last:border-b-0"
          >
            <span className="w-10 shrink-0 text-xs text-neutral-700">{formatDayMonth(e.date)}</span>
            <span className="min-w-0 flex-1 truncate">{e.description}</span>
            <span className="hidden shrink-0 text-xs text-neutral-700 sm:block">
              {e.categoryName}
            </span>
            <span className="w-24 shrink-0 text-right font-bold">{formatCurrency(e.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

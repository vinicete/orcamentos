import { formatCurrency, type FixedItemRow } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';

function DeltaCell({ row }: { row: FixedItemRow }) {
  if (row.status === 'PENDENTE' || row.delta === null) {
    return <span className="text-xs text-neutral-700 uppercase">pendente</span>;
  }
  // delta = orçado - realizado (Fase 4): negativo é estouro. Só esse caso usa o accent puro (§4.2).
  const overBy = -row.delta;
  if (overBy > 0) {
    return <span className="font-bold text-accent-700">+{formatCurrency(overBy)}</span>;
  }
  return <span className="text-neutral-700">{formatCurrency(row.delta)}</span>;
}

export function FixedItemsTable({ items }: { items: FixedItemRow[] }) {
  if (items.length === 0) return null;

  return (
    <div className="border-2 border-text p-4">
      <SectionLabel className="mb-3 text-accent">Fixos · orçado x realizado</SectionLabel>
      <div>
        <div className="flex items-center gap-3 border-b-2 border-text pb-1.5 text-[10px] tracking-[.08em] text-neutral-700 uppercase">
          <span className="min-w-0 flex-1">Item</span>
          <span className="w-24 shrink-0 text-right">Orçado</span>
          <span className="w-24 shrink-0 text-right">Realizado</span>
          <span className="w-24 shrink-0 text-right">Delta</span>
        </div>
        {items.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3 border-b border-divider py-2 text-sm last:border-b-0"
          >
            <span className="min-w-0 flex-1 truncate">{row.description}</span>
            <span className="w-24 shrink-0 text-right text-neutral-700">
              {row.budget !== null ? formatCurrency(row.budget) : '—'}
            </span>
            <span className="w-24 shrink-0 text-right font-bold">
              {row.status === 'PENDENTE' ? '—' : formatCurrency(row.amount)}
            </span>
            <span className="w-24 shrink-0 text-right">
              <DeltaCell row={row} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { formatCurrency, type DashboardSummary } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';

export function KpiStrip({ summary }: { summary: DashboardSummary }) {
  const items = [
    { label: 'Gasto do mês', value: formatCurrency(summary.totalSpent) },
    { label: 'Adicionais', value: formatCurrency(summary.additionalSpent) },
    { label: 'Cartão', value: formatCurrency(summary.cardTotal) },
    { label: 'Nº de lançamentos', value: String(summary.entryCount) },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="border-2 border-text p-4">
          <SectionLabel className="text-accent">{item.label}</SectionLabel>
          <div className="mt-1.5 font-heading text-2xl font-bold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

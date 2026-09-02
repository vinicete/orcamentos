import { formatCurrency, type CategoryTotal } from '@orcamento/shared';
import { MeterBar } from '@/components/ui/meter-bar';
import { SectionLabel } from '@/components/ui/section-label';

export function CategoryBars({
  categories,
  colorByCategoryId,
}: {
  categories: CategoryTotal[];
  colorByCategoryId: Map<string, string>;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="mb-6 border-2 border-text p-4">
      <SectionLabel className="mb-3 text-accent">Gasto por categoria</SectionLabel>
      <div className="flex flex-col gap-2.5">
        {categories.map((c) => (
          <div key={c.categoryId}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>{c.name}</span>
              <span className="text-neutral-700">
                {formatCurrency(c.total)} · {Math.round(c.pct * 100)}%
              </span>
            </div>
            <MeterBar
              value={c.pct * 100}
              max={100}
              height="h-2.5"
              color={colorByCategoryId.get(c.categoryId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import { getCategoryColor, type Category } from '@orcamento/shared';

export function CategoryLegend({ categories }: { categories: Category[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-divider pt-3">
      {categories.map((c) => (
        <div key={c.id} className="flex items-center gap-1.5 text-[11px] text-neutral-700">
          <span
            className="size-2.5 shrink-0"
            style={{ backgroundColor: getCategoryColor(c.order) }}
          />
          {c.name}
        </div>
      ))}
    </div>
  );
}

import type { Category } from '@orcamento/shared';

export function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`border border-divider px-3 py-2 text-xs font-semibold ${
              active ? 'bg-accent text-bg' : 'bg-transparent text-text'
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

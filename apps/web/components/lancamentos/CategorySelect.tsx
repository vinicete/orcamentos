import type { Category } from '@orcamento/shared';

export function CategorySelect({
  categories,
  value,
  onChange,
  className = '',
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`min-h-10 w-full border border-divider bg-surface px-2.5 py-2 text-sm text-text ${className}`}
    >
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

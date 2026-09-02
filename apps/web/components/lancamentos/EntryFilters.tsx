import type { Category, TipoLancamento } from '@orcamento/shared';
import { Input } from '@/components/ui/input';

type TypeFilterValue = TipoLancamento | '';

const TYPE_OPTIONS: Array<{ value: TypeFilterValue; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'FIXO', label: 'Fixo' },
  { value: 'ADICIONAL', label: 'Adicional' },
  { value: 'CARTAO', label: 'Cartão' },
];

function TypeFilter({
  value,
  onChange,
}: {
  value: TypeFilterValue;
  onChange: (value: TypeFilterValue) => void;
}) {
  return (
    <div className="flex border border-divider">
      {TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value || 'all'}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`border-r border-divider px-3 py-2 text-xs font-heading tracking-[.06em] uppercase last:border-r-0 ${
            value === opt.value ? 'bg-accent text-bg' : 'bg-transparent text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EntryFilters({
  categories,
  q,
  onQChange,
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
}: {
  categories: Category[];
  q: string;
  onQChange: (q: string) => void;
  type: TypeFilterValue;
  onTypeChange: (type: TypeFilterValue) => void;
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      <Input
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder="Buscar por descrição…"
        className="min-w-40 flex-1"
      />
      <TypeFilter value={type} onChange={onTypeChange} />
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="min-h-11 border border-divider bg-surface px-2.5 text-sm text-text"
      >
        <option value="">Todas categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

import type { TipoLancamento } from '@orcamento/shared';

const TYPES: Array<{ value: TipoLancamento; label: string }> = [
  { value: 'FIXO', label: 'Fixo' },
  { value: 'ADICIONAL', label: 'Adicional' },
  { value: 'CARTAO', label: 'Cartão' },
];

export function TypeSegmented({
  value,
  onChange,
  className = '',
}: {
  value: TipoLancamento;
  onChange: (type: TipoLancamento) => void;
  className?: string;
}) {
  return (
    <div className={`flex border border-divider ${className}`}>
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`flex-1 border-r border-divider px-4 py-2 text-xs font-heading tracking-[.06em] uppercase last:border-r-0 ${
            value === t.value ? 'bg-accent text-bg' : 'bg-transparent text-text'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

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
    // min-w-0 + overflow-x-auto: mesma correção do EntryFilters (Fase 12) — sem isso, num
    // espaço estreito (ex.: a sheet mobile) esse bloco força a página a esticar em vez de só
    // rolar por conta própria. flex-1 continua fazendo os botões dividirem o espaço igualmente
    // quando há espaço de sobra (ex.: desktop).
    <div className={`min-w-0 overflow-x-auto ${className}`}>
      <div className="flex border border-divider">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex-1 border-r border-divider px-4 py-2 text-xs font-heading tracking-[.06em] whitespace-nowrap uppercase last:border-r-0 ${
              value === t.value ? 'bg-accent text-bg' : 'bg-transparent text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

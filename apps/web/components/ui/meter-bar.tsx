/**
 * Barra de progresso que vira accent ao estourar (docs/PLANO_IMPLEMENTACAO.md §4.1/§4.2).
 * A largura é uma % calculada em runtime — Tailwind não tem como expressar isso como classe
 * estática, então esse é o único lugar do projeto com `style` inline, por necessidade real,
 * não por reaproveitar o padrão do protótipo do Claude Design.
 */
export function MeterBar({
  value,
  max,
  className = '',
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  const over = max > 0 && value > max;

  return (
    <div className={`h-1.5 w-full bg-neutral-200 ${className}`}>
      <div className={`h-full ${over ? 'bg-accent' : 'bg-text'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

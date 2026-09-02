/**
 * Barra de progresso que vira accent ao estourar (docs/PLANO_IMPLEMENTACAO.md §4.1/§4.2).
 * A largura é uma % calculada em runtime — Tailwind não tem como expressar isso como classe
 * estática, então esse é o único lugar do projeto com `style` inline, por necessidade real,
 * não por reaproveitar o padrão do protótipo do Claude Design. `color` (usado pelas barras de
 * categoria do dashboard, Fase 8) é a mesma exceção — cor de categoria é dado do usuário, não
 * uma paleta fixa em classes Tailwind.
 */
export function MeterBar({
  value,
  max,
  color,
  height = 'h-1.5',
  className = '',
}: {
  value: number;
  max: number;
  color?: string;
  height?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  const over = max > 0 && value > max;

  return (
    <div className={`w-full bg-neutral-200 ${height} ${className}`}>
      <div
        className={`h-full ${color ? '' : over ? 'bg-accent' : 'bg-text'}`}
        style={{ width: `${pct}%`, ...(color && { backgroundColor: color }) }}
      />
    </div>
  );
}

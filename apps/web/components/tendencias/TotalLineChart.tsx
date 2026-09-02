import { formatCurrencyShort, monthShortLabel, type TrendMonth } from '@orcamento/shared';

// Se mudar WIDTH/HEIGHT, atualizar também a classe `aspect-[600/170]` do wrapper abaixo —
// Tailwind não lê variável dentro de `aspect-[]`, tem que ser o literal.
const WIDTH = 600;
const HEIGHT = 170;
const PADDING_X = 24;
const PADDING_TOP = 22; // espaço pro rótulo de valor acima do ponto mais alto
const PADDING_BOTTOM = 24; // espaço pro nome do mês embaixo

/** Linha de total mensal em SVG, com linha tracejada da média — sem biblioteca de gráficos (§0.4 #5). */
export function TotalLineChart({ months, average }: { months: TrendMonth[]; average: number }) {
  const maxTotal = Math.max(1, average, ...months.map((m) => m.total));
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = months.length > 1 ? (WIDTH - PADDING_X * 2) / (months.length - 1) : 0;

  function y(value: number) {
    return PADDING_TOP + plotHeight - (value / maxTotal) * plotHeight;
  }
  const pctX = (x: number) => (x / WIDTH) * 100;
  const pctY = (y: number) => (y / HEIGHT) * 100;

  const points = months.map((m, i) => `${PADDING_X + i * stepX},${y(m.total)}`).join(' ');
  const avgY = y(average);

  return (
    // Os rótulos são HTML posicionado em %, não <text> do SVG: dentro do SVG o tamanho de fonte
    // escala junto com o viewBox (600 unidades esticadas pra até ~1200px de container ficam 2x
    // maiores que o esperado) — como HTML sobreposto, o texto tem um tamanho de fonte real em
    // pixel, igual ao resto do app, não importa o quanto o gráfico estique.
    <div className="relative aspect-[600/170] w-full">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 h-full w-full">
        <line
          x1={PADDING_X}
          y1={avgY}
          x2={WIDTH - PADDING_X}
          y2={avgY}
          strokeDasharray="4 4"
          className="stroke-neutral-500 stroke-1"
        />
        <polyline points={points} className="fill-none stroke-accent stroke-2" />
        {months.map((m, i) => (
          <circle
            key={m.month}
            cx={PADDING_X + i * stepX}
            cy={y(m.total)}
            r={3}
            className="fill-accent"
          />
        ))}
      </svg>

      <span
        className="absolute -translate-y-full text-[10px] text-neutral-700"
        style={{ left: `${pctX(WIDTH - PADDING_X)}%`, top: `${pctY(avgY) - 1}%` }}
      >
        média {formatCurrencyShort(average)}
      </span>

      {months.map((m, i) => {
        const cx = PADDING_X + i * stepX;
        return (
          <div key={m.month} className="absolute top-0 bottom-0" style={{ left: `${pctX(cx)}%` }}>
            {m.total > 0 && (
              <span
                className="absolute -translate-x-1/2 -translate-y-full text-[10px] font-semibold whitespace-nowrap text-text"
                style={{ top: `${pctY(y(m.total)) - 2}%` }}
              >
                {formatCurrencyShort(m.total)}
              </span>
            )}
            <span className="absolute bottom-0 -translate-x-1/2 text-[10px] tracking-[.04em] whitespace-nowrap text-neutral-700 uppercase">
              {monthShortLabel(m.month)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { formatCurrencyShort, monthShortLabel, type TrendMonth } from '@orcamento/shared';

const CHART_HEIGHT = 160;

/** Barras empilhadas categoria × mês — clicar numa coluna navega pra aquele mês (§0.1/§4.1). */
export function StackedMonthChart({
  months,
  colorByCategoryId,
  selectedMonth,
}: {
  months: TrendMonth[];
  colorByCategoryId: Map<string, string>;
  selectedMonth: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const maxTotal = Math.max(1, ...months.map((m) => m.total));

  return (
    <div className="flex items-end gap-2 pt-4">
      {months.map((m) => {
        const params = new URLSearchParams(searchParams);
        params.set('mes', m.month);
        const active = m.month === selectedMonth;
        const barHeight = m.total > 0 ? Math.max(4, (m.total / maxTotal) * CHART_HEIGHT) : 2;

        return (
          <Link
            key={m.month}
            href={`${pathname}?${params.toString()}`}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="relative w-full" style={{ height: `${CHART_HEIGHT}px` }}>
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col-reverse overflow-hidden"
                style={{ height: `${barHeight}px` }}
              >
                {m.total > 0 ? (
                  m.byCategory.map((c) => (
                    <div
                      key={c.categoryId}
                      style={{
                        height: `${(c.total / m.total) * 100}%`,
                        backgroundColor: colorByCategoryId.get(c.categoryId) ?? undefined,
                      }}
                    />
                  ))
                ) : (
                  <div className="h-full w-full bg-neutral-200" />
                )}
              </div>
              {m.total > 0 && (
                <span
                  className="absolute inset-x-0 text-center text-[9px] font-semibold whitespace-nowrap text-neutral-700"
                  style={{ bottom: `${barHeight + 4}px` }}
                >
                  {formatCurrencyShort(m.total)}
                </span>
              )}
            </div>
            <span
              className={`font-heading text-[10px] tracking-[.06em] uppercase ${
                active ? 'text-accent' : 'text-neutral-700'
              }`}
            >
              {monthShortLabel(m.month)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

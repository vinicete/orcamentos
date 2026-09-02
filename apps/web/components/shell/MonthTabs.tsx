'use client';

import { useState } from 'react';
import { currentMonthKey, monthShortLabel } from '@orcamento/shared';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Ano civil inteiro (Jan–Dez), não os últimos 12 meses a partir de hoje (§0.4 #6 do plano) —
 * um lançamento com data futura ou de anos anteriores fica sempre alcançável, sem precisar
 * editar a URL na mão. `viewYear` é o ano das abas mostradas; some independente do mês
 * selecionado (`?mes=`) até o usuário trocar de ano ou navegar pra um mês de outro ano.
 */
export function MonthTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get('mes') ?? currentMonthKey();
  const selectedYear = Number(selected.split('-')[0]);

  // Realinha a janela de anos quando o mês selecionado muda de ano (ex.: veio de um link
  // direto, ou de clicar numa barra do Trends) — ajuste de estado durante o render, não em
  // useEffect (evita o cascading render que a regra `set-state-in-effect` aponta; é o padrão
  // que o próprio React recomenda pra "resetar estado quando uma prop muda").
  const [viewYear, setViewYear] = useState(selectedYear);
  const [trackedSelectedYear, setTrackedSelectedYear] = useState(selectedYear);
  if (selectedYear !== trackedSelectedYear) {
    setTrackedSelectedYear(selectedYear);
    setViewYear(selectedYear);
  }

  const months = Array.from(
    { length: 12 },
    (_, i) => `${viewYear}-${String(i + 1).padStart(2, '0')}`,
  );

  return (
    <div className="mx-auto flex max-w-[1320px] items-center gap-3 overflow-x-auto px-5 pb-2.5">
      <div className="flex shrink-0 items-center gap-1 font-heading text-xs tracking-[.08em]">
        <button
          type="button"
          onClick={() => setViewYear((y) => y - 1)}
          aria-label="Ano anterior"
          className="cursor-pointer px-1 text-neutral-700 hover:text-text"
        >
          ‹
        </button>
        <span className="px-0.5 text-text">{viewYear}</span>
        <button
          type="button"
          onClick={() => setViewYear((y) => y + 1)}
          aria-label="Próximo ano"
          className="cursor-pointer px-1 text-neutral-700 hover:text-text"
        >
          ›
        </button>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {months.map((m) => {
          const params = new URLSearchParams(searchParams);
          params.set('mes', m);
          const active = m === selected;
          return (
            <Link
              key={m}
              href={`${pathname}?${params.toString()}`}
              className={`shrink-0 border border-divider px-3.5 py-1.5 font-heading text-xs tracking-[.1em] ${
                active ? 'bg-accent text-bg' : 'bg-transparent text-text'
              }`}
            >
              {monthShortLabel(m)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

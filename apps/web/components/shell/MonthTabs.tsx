'use client';

import { currentMonthKey, lastNMonths, monthShortLabel } from '@orcamento/shared';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const VISIBLE_MONTHS = 12;

export function MonthTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get('mes') ?? currentMonthKey();
  const months = lastNMonths(VISIBLE_MONTHS);

  return (
    <div className="mx-auto flex max-w-[1320px] gap-1.5 overflow-x-auto px-5 pb-2.5">
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
  );
}

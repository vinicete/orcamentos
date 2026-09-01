'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tendencias', label: 'Tendências' },
  { href: '/recorrentes', label: 'Recorrentes' },
  { href: '/categorias', label: 'Categorias' },
];

export function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav className="flex items-center gap-5 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={qs ? `${item.href}?${qs}` : item.href}
            className={`shrink-0 border-b-2 py-1 text-[13px] font-semibold tracking-[.08em] uppercase ${
              active ? 'border-accent text-accent' : 'border-transparent text-text'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

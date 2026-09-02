'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV_PRIMARY } from './nav-items';

/** Barra fixa embaixo, só no mobile — no desktop a navegação já está no header (NavLinks). */
export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t-2 border-text bg-bg md:hidden">
      {NAV_PRIMARY.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={qs ? `${item.href}?${qs}` : item.href}
            className={`px-1 py-3.5 text-center text-[11px] font-heading tracking-[.08em] uppercase ${
              active ? 'text-accent' : 'text-text'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

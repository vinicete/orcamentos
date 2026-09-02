'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV_PRIMARY, NAV_SECONDARY } from './nav-items';

const ALL_ITEMS = [...NAV_PRIMARY, ...NAV_SECONDARY];

/** Nav completo (5 seções) — só no header desktop; no mobile o essencial vira BottomNav. */
export function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav className="hidden items-center gap-5 overflow-x-auto md:flex">
      {ALL_ITEMS.map((item) => {
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

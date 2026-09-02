'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV_SECONDARY } from './nav-items';

/**
 * Recorrentes/Categorias não existem no design original (docs/PLANO_IMPLEMENTACAO.md
 * §0.4 #1) — no mobile o design só reserva espaço pra 3 seções + FAB na barra de
 * baixo, então essas duas ficam aqui, compactas, no header, pra não sumir no celular.
 */
export function MobileSecondaryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav className="flex items-center gap-3 md:hidden">
      {NAV_SECONDARY.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={qs ? `${item.href}?${qs}` : item.href}
            className={`text-[10px] font-semibold tracking-[.06em] uppercase ${
              active ? 'text-accent' : 'text-neutral-700'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

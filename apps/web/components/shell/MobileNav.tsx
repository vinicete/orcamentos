'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NAV_PRIMARY, NAV_SECONDARY } from './nav-items';
import { SignOutButton } from './SignOutButton';

const ALL_ITEMS = [...NAV_PRIMARY, ...NAV_SECONDARY];

/** Menu hamburguer — única navegação no mobile (substitui a barra de baixo + linha
 * secundária que existiam antes; mais simples de manter e cabe as 5 seções de igual pra igual,
 * sem ter que decidir quais 3 "merecem" ficar sempre visíveis). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center text-text md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-4">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle className="font-heading text-[13px] tracking-[.08em] text-accent uppercase">
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1">
            {ALL_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={qs ? `${item.href}?${qs}` : item.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-3 text-sm font-heading tracking-[.06em] uppercase ${
                    active ? 'bg-accent text-bg' : 'text-text hover:bg-surface'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-divider pt-4">
            <SignOutButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

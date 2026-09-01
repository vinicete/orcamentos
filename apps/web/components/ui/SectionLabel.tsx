import type { HTMLAttributes } from 'react';

/** Equivalente ao `h6` do ds-modernist.css (13px, peso 800, uppercase, tracking largo) — Tailwind reseta headings, então isso vira componente em vez de depender do elemento puro. */
export function SectionLabel({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h6
      className={`font-heading text-[13px] leading-tight tracking-[.08em] uppercase ${className}`}
      {...props}
    />
  );
}

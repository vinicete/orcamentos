import type { ReactNode } from 'react';
import { SectionLabel } from '@/components/ui/section-label';

export function AuthShell({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <div className="flex min-h-55 flex-col justify-between bg-brand px-10 py-12 text-on-brand">
        <div className="text-[13px] tracking-[.14em] uppercase">Orçamento pessoal</div>
        <div>
          <h1 className="mb-4 font-heading text-[40px] leading-[0.95] tracking-[-.03em] md:text-[56px]">
            TODO GASTO
            <br />
            CONTA.
          </h1>
          <p className="max-w-[34ch] text-[15px] opacity-90">
            Do aluguel ao cafezinho: fixos, adicionais e cartão no mesmo lugar.
          </p>
        </div>
        <div className="text-[11px] tracking-[.1em] uppercase opacity-75">
          Fixo · Adicional · Cartão
        </div>
      </div>

      <div className="flex max-w-[460px] flex-col justify-center px-10 py-12">
        <SectionLabel className="mb-1.5 text-accent">{label}</SectionLabel>
        <h2 className="mb-7 font-heading text-[28px]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

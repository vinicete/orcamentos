import { Suspense } from 'react';
import { Header } from '@/components/shell/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header usa useSearchParams (mês selecionado) — precisa de Suspense. */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-5 py-6">{children}</main>
    </div>
  );
}

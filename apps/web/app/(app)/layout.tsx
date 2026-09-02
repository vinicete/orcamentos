import { Suspense } from 'react';
import { BottomNav } from '@/components/shell/BottomNav';
import { Header } from '@/components/shell/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header e BottomNav usam useSearchParams (mês selecionado) — precisam de Suspense. */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-5 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}

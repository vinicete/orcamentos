'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@orcamento/shared';
import { api } from '@/lib/api-client';
import { EntryList } from './EntryList';
import { NewExpensePanel } from './NewExpensePanel';
import { SummaryRail } from './SummaryRail';

/**
 * Orquestra o painel de novo lançamento, a lista e o rail lateral — os três dependem
 * do mesmo mês e precisam se atualizar juntos quando um lançamento é criado, editado,
 * excluído ou um fixo pendente é quitado. `refreshKey` é o sinal simples pra isso: cada
 * ação bem-sucedida incrementa e os três componentes que dependem de dados do servidor
 * reagem via `useEffect`.
 */
export function LancamentosView({ month }: { month: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    api.getCategories().then((cats) => {
      if (!ignore) setCategories(cats);
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-[1120px]:flex min-[1120px]:items-start min-[1120px]:gap-6">
      <div className="min-w-0 flex-1">
        <NewExpensePanel month={month} onSaved={bump} />
        <EntryList month={month} categories={categories} refreshKey={refreshKey} onChanged={bump} />
      </div>
      <SummaryRail
        month={month}
        refreshKey={refreshKey}
        onChanged={bump}
        className="mt-6 hidden shrink-0 min-[1120px]:mt-0 min-[1120px]:block min-[1120px]:w-[300px]"
      />
    </div>
  );
}

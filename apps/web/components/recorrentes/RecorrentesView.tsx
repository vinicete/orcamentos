'use client';

import { useEffect, useState } from 'react';
import { ApiError, type Category, type FixedItem } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';
import { FixedItemRow } from './FixedItemRow';
import { NewFixedItemForm } from './NewFixedItemForm';

export function RecorrentesView() {
  const [items, setItems] = useState<FixedItem[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    api
      .getFixedItems()
      .then((its) => {
        if (ignore) return;
        setError(null);
        setItems(its);
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof ApiError ? err.message : 'Não foi possível carregar os itens fixos.',
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let ignore = false;
    api.getCategories().then((cats) => {
      if (!ignore) setCategories(cats);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const hasCeiling = (items ?? []).some((i) => i.role === 'ADDITIONAL_CEILING');
  const hasCardInvoice = (items ?? []).some((i) => i.role === 'CARD_INVOICE');

  return (
    <div>
      <SectionLabel className="mb-3 text-accent">Recorrentes</SectionLabel>
      <NewFixedItemForm categories={categories} onCreated={bump} />
      {error && <p className="text-sm text-accent-700">{error}</p>}
      {!error &&
        (items === null ? (
          <p className="text-sm text-neutral-700">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-700">Nenhum item fixo cadastrado.</p>
        ) : (
          items.map((item) => (
            <FixedItemRow
              key={item.id}
              item={item}
              categories={categories}
              hasCeiling={hasCeiling}
              hasCardInvoice={hasCardInvoice}
              onChanged={bump}
            />
          ))
        ))}
    </div>
  );
}

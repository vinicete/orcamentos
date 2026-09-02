'use client';

import { useEffect, useState } from 'react';
import type { Category, FixedItem } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';
import { FixedItemRow } from './FixedItemRow';
import { NewFixedItemForm } from './NewFixedItemForm';

export function RecorrentesView() {
  const [items, setItems] = useState<FixedItem[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    api.getFixedItems().then((its) => {
      if (!ignore) setItems(its);
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
      {items === null ? (
        <p className="text-sm text-neutral-700">Carregando…</p>
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
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getCategoryColor, type Category, type DashboardSummary } from '@orcamento/shared';
import { api } from '@/lib/api-client';
import { BiggestExpenses } from './BiggestExpenses';
import { CategoryBars } from './CategoryBars';
import { FixedItemsTable } from './FixedItemsTable';
import { KpiStrip } from './KpiStrip';

export function DashboardView({ month }: { month: string }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let ignore = false;
    api.getDashboardSummary(month).then((s) => {
      if (!ignore) setSummary(s);
    });
    return () => {
      ignore = true;
    };
  }, [month]);

  useEffect(() => {
    let ignore = false;
    api.getCategories().then((cats) => {
      if (!ignore) setCategories(cats);
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (!summary) return <div className="text-sm text-neutral-700">Carregando…</div>;

  const colorByCategoryId = new Map(categories.map((c) => [c.id, getCategoryColor(c.order)]));

  return (
    <div>
      <KpiStrip summary={summary} />
      <CategoryBars categories={summary.categories} colorByCategoryId={colorByCategoryId} />
      <BiggestExpenses items={summary.topExpenses} />
      <FixedItemsTable items={summary.fixedItems} />
    </div>
  );
}

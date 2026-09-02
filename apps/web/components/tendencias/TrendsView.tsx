'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  formatCurrency,
  getCategoryColor,
  type Category,
  type TrendResponse,
} from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';
import { CategoryLegend } from './CategoryLegend';
import { StackedMonthChart } from './StackedMonthChart';
import { TotalLineChart } from './TotalLineChart';

export function TrendsView({ month }: { month: string }) {
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .getDashboardTrend()
      .then((t) => {
        if (ignore) return;
        setError(null);
        setTrend(t);
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof ApiError ? err.message : 'Não foi possível carregar as tendências.',
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    api.getCategories().then((cats) => {
      if (!ignore) setCategories(cats);
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (error) return <div className="text-sm text-accent-700">{error}</div>;
  if (!trend) return <div className="text-sm text-neutral-700">Carregando…</div>;

  const colorByCategoryId = new Map(categories.map((c) => [c.id, getCategoryColor(c.order)]));

  return (
    <div>
      <div className="mb-6 border-2 border-text p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <SectionLabel className="text-accent">Total por mês</SectionLabel>
          <span className="text-xs text-neutral-700">Média: {formatCurrency(trend.average)}</span>
        </div>
        <TotalLineChart months={trend.months} average={trend.average} />
      </div>

      <div className="border-2 border-text p-4">
        <SectionLabel className="mb-3 text-accent">Gasto por categoria × mês</SectionLabel>
        <StackedMonthChart
          months={trend.months}
          colorByCategoryId={colorByCategoryId}
          selectedMonth={month}
        />
        <CategoryLegend categories={categories} />
      </div>
    </div>
  );
}

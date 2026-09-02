'use client';

import { useEffect, useState } from 'react';
import { ApiError, type Category } from '@orcamento/shared';
import { SectionLabel } from '@/components/ui/section-label';
import { api } from '@/lib/api-client';
import { CategoryRow } from './CategoryRow';
import { NewCategoryForm } from './NewCategoryForm';

export function CategoriasView() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    api
      .getCategories()
      .then((cats) => {
        if (ignore) return;
        setError(null);
        setCategories(cats);
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof ApiError ? err.message : 'Não foi possível carregar as categorias.',
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return (
    <div className="max-w-xl">
      <SectionLabel className="mb-3 text-accent">Categorias</SectionLabel>
      <NewCategoryForm onCreated={bump} />
      {error && <p className="text-sm text-accent-700">{error}</p>}
      {!error &&
        (categories === null ? (
          <p className="text-sm text-neutral-700">Carregando…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-neutral-700">Nenhuma categoria cadastrada.</p>
        ) : (
          categories.map((c) => <CategoryRow key={c.id} category={c} onChanged={bump} />)
        ))}
    </div>
  );
}

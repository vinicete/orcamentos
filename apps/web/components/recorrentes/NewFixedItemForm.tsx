'use client';

import { useState, type KeyboardEvent } from 'react';
import { ApiError, parseAmount, type Category } from '@orcamento/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';

export function NewFixedItemForm({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createFixedItem({
        name: trimmed,
        defaultBudget: parseAmount(budget),
        categoryId: categoryId || undefined,
      });
      setName('');
      setBudget('');
      setCategoryId('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o item fixo.');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div className="mb-4 border-2 border-text p-3">
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="min-w-40 flex-1">
          <Label>Nome</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ex.: Aluguel"
          />
        </div>
        <div className="w-28">
          <Label>Orçado</Label>
          <Input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="0,00"
          />
        </div>
        <div className="w-44">
          <Label>Categoria</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="min-h-11 w-full border border-divider bg-surface px-2.5 text-[15px] text-text"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? '...' : 'Adicionar'}
        </Button>
      </div>
      {error && <p className="mt-2 text-[11px] text-accent-700">{error}</p>}
    </div>
  );
}

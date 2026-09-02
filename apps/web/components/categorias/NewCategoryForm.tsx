'use client';

import { useState, type KeyboardEvent } from 'react';
import { ApiError } from '@orcamento/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';

export function NewCategoryForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
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
      await api.createCategory({ name: trimmed });
      setName('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a categoria.');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nova categoria…"
          className="flex-1"
        />
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? '...' : 'Adicionar'}
        </Button>
      </div>
      {error && <p className="mt-1 text-[11px] text-accent-700">{error}</p>}
    </div>
  );
}

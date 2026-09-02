'use client';

import { useState, type KeyboardEvent } from 'react';
import { ApiError, type Category } from '@orcamento/shared';
import { api } from '@/lib/api-client';
import { useConfirmDialog } from '@/lib/confirm-context';

export function CategoryRow({
  category,
  onChanged,
}: {
  category: Category;
  onChanged: () => void;
}) {
  const { confirm, alert } = useConfirmDialog();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setName(category.name);
    setError(null);
    setEditing(true);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateCategory(category.id, { name: trimmed });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!(await confirm(`Excluir a categoria "${category.name}"?`))) return;
    try {
      await api.deleteCategory(category.id);
      onChanged();
    } catch (err) {
      await alert(err instanceof ApiError ? err.message : 'Não foi possível excluir.');
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <div className="border-b-2 border-accent py-2">
        <div className="flex items-center gap-2" onKeyDown={onKeyDown}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-9 flex-1 border border-divider bg-surface px-2 text-sm text-text"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="min-h-9 cursor-pointer bg-accent px-3 text-xs font-heading font-bold text-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-9 cursor-pointer px-2 text-xs text-neutral-700"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] text-accent-700">{error}</p>}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') startEdit();
      }}
      className="flex cursor-pointer items-center gap-3 border-b border-divider py-2.5 text-sm hover:bg-surface"
    >
      <span className="min-w-0 flex-1 truncate">{category.name}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          remove();
        }}
        aria-label="Excluir categoria"
        className="shrink-0 cursor-pointer px-1 text-neutral-700 hover:text-accent"
      >
        ×
      </button>
    </div>
  );
}

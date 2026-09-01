// Formatação pt-BR (docs/PLANO_IMPLEMENTACAO.md §4.2) — usado nos componentes de valor.

export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyShort(value: number): string {
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}

/** Aceita tanto "1.234,56" (pt-BR) quanto "1234.56" (en-US), como o campo de valor do design. */
export function parseAmount(value: string): number {
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isNaN(n) ? 0 : n;
}

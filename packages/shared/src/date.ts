/** Mês atual no formato "YYYY-MM" — usado como default do seletor de mês na URL. */
export function currentMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Últimos `n` meses (formato "YYYY-MM"), em ordem cronológica, terminando no mês de `anchor`. */
export function lastNMonths(n: number, anchor: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    months.push(currentMonthKey(d));
  }
  return months;
}

const MONTH_LABELS_PT = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

/** "2026-08" -> "AGO" */
export function monthShortLabel(yyyyMm: string): string {
  const month = Number(yyyyMm.split('-')[1]);
  return MONTH_LABELS_PT[month - 1];
}

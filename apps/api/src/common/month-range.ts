/** Intervalo [gte, lt) em UTC pro mês "YYYY-MM" — usado em filtros de data do Prisma. */
export function monthRange(yyyyMm: string): { gte: Date; lt: Date } {
  const [year, month] = yyyyMm.split('-').map(Number);
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  };
}

/** Últimos `n` meses (formato "YYYY-MM"), em ordem cronológica, terminando no mês de `anchor`. */
export function lastNMonths(n: number, anchor: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

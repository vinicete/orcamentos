const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Converte durações no formato do `jsonwebtoken` ("15m", "7d", ...) para milissegundos, para uso em `cookie.maxAge`. */
export function durationToMs(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Duração inválida: "${value}" (use algo como "15m" ou "7d")`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}

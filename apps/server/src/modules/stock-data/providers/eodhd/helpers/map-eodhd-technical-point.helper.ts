/**
 * Normalize an EODHD technical-indicator row into `{ date, value }`. EODHD
 * returns the value under the function-name key (e.g. `rsi`, `sma`), not a
 * generic `value` field.
 */
export function mapEodhdTechnicalPoint(
  p: unknown,
  fn: string,
): { date: string; value: number } {
  const row = p as Record<string, unknown>;
  const value = Number(row[fn] ?? row[fn.toLowerCase()] ?? NaN);
  return { date: String(row.date), value };
}

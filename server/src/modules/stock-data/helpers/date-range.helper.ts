/** Inclusive [from, to] window of YYYY-MM-DD dates. */
export interface DateRange {
  from: string;
  to: string;
}

/** Add days to a YYYY-MM-DD date string (UTC), returning YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's date as YYYY-MM-DD (UTC). */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

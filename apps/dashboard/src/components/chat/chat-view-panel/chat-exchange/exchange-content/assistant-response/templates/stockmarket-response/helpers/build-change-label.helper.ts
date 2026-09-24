/**
 * Compose a compact "change" label from an absolute change and/or a percent
 * change, e.g. `+1.5` / `+2.3%` / `+1.5 +2.3%`. Returns an empty string when
 * neither value is provided.
 */
export function buildChangeLabel(change?: number, changeP?: number): string {
  if (change === undefined && changeP === undefined) return '';
  const parts: string[] = [];
  if (change !== undefined) parts.push(change > 0 ? `+${change}` : `${change}`);
  if (changeP !== undefined) parts.push(`${changeP > 0 ? '+' : ''}${changeP}%`);
  return parts.join(' ');
}

import type { DlqEntry } from '../../../../types/dlq-entry.model';

export function getDlqFilters(
  entry: DlqEntry | null,
): Record<string, unknown> | null {
  const payload = entry?.payload;
  if (!payload) return null;
  return (payload as { filters?: Record<string, unknown> })?.filters ?? null;
}

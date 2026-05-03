import type { DlqEntry } from '@/types/dlq-entry.model';

export function buildPayloadWithFilterUpdate(
  entry: DlqEntry | null,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const payload = JSON.parse(JSON.stringify(entry?.payload ?? {}));
  if (!payload.filters) payload.filters = {};
  (payload.filters as Record<string, unknown>)[key] = value;
  return payload;
}

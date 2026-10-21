import type { DlqEntry } from '../../../../../types/dlq-entry.model';

export function getPayloadImageNames(entry: DlqEntry): string {
  const meta = (entry.payload as Record<string, unknown> | null)?.meta as
    Array<{ name?: string }> | undefined;
  if (!meta?.length) return '—';
  return meta.map((m) => m.name ?? 'unnamed').join(', ');
}

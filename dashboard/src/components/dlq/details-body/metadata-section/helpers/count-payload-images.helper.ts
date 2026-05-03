import type { DlqEntry } from '../../../../../types/dlq-entry.model';

export function countPayloadImages(entry: DlqEntry): number {
  const meta = (entry.payload as Record<string, unknown> | null)?.meta as
    Array<unknown> | undefined;
  return meta?.length ?? 0;
}

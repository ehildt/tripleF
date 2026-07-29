import type { DlqEntry } from '@/types/dlq-entry.model';

import { parseFailureReason } from './parse-failure-reason.helper';

/**
 * The display text of an entry's failure reason — always plain text, never
 * a JSON dump (complex reasons are unwrapped to their message).
 */
export function resolveFailureText(entry: DlqEntry | null): string | null {
  return parseFailureReason(entry?.failedReason)?.text ?? null;
}

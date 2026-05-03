import type { DlqEntry } from '../../../../types/dlq-entry.model';

export function resolveFailureText(entry: DlqEntry | null): string | null {
  const reason = entry?.failedReason;
  if (!reason) return null;
  if (/^[{}[]/.test(reason.trim())) {
    try {
      const obj = JSON.parse(reason) as Record<string, unknown>;
      return (
        (obj.message as string) ||
        (obj.error as string) ||
        (obj.reason as string) ||
        obj.toString() ||
        reason
      );
    } catch {
      return reason;
    }
  }
  return reason;
}

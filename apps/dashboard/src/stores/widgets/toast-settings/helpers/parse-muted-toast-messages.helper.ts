import type { MutedToastMessage } from '../toast-settings.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isMutedToastMessage(value: unknown): value is MutedToastMessage {
  const entry = asRecord(value);
  return typeof entry?.key === 'string' && typeof entry.sample === 'string';
}

/** Parse muted message history, retaining every valid entry in its existing order. */
export function parseMutedToastMessages(
  saved: string | null,
): MutedToastMessage[] {
  if (saved === null) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isMutedToastMessage) : [];
  } catch {
    return [];
  }
}

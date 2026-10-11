import type { KeyFinding } from '@/types/harness-response-data.model';

/** Keeps key findings that carry a non-empty text. */
export function filterValidKeyFindings(items?: KeyFinding[]): KeyFinding[] {
  return (items ?? []).filter(
    (item): item is KeyFinding =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as KeyFinding).text === 'string' &&
      (item as KeyFinding).text.trim().length > 0,
  );
}

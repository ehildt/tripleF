import type { DlqEntry } from '@/types/dlq-entry.model';

/**
 * Does a pushed DLQ entry belong in the currently visible list? Mirrors the
 * server query in DeadLetterRepository.findAll: status is an exact match;
 * search is a case-insensitive contains across jobName, queueName, and
 * failedReason, with `JSON.stringify(payload)` standing in for Postgres'
 * `payload::text ILIKE` (same semantics for real JSON payloads).
 * Pure and store-free — the store action passes its current filter values.
 */
export function entryMatchesDlqFilters(
  entry: DlqEntry,
  filters: { status?: string; search?: string },
): boolean {
  if (filters.status && entry.status !== filters.status) return false;

  const search = filters.search?.trim().toLowerCase();
  if (!search) return true;

  return (
    entry.jobName.toLowerCase().includes(search) ||
    entry.queueName.toLowerCase().includes(search) ||
    (entry.failedReason?.toLowerCase().includes(search) ?? false) ||
    JSON.stringify(entry.payload ?? null)
      .toLowerCase()
      .includes(search)
  );
}

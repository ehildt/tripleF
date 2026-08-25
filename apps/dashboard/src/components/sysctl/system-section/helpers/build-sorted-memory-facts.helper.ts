import type { MemoryFactRecord } from '@/api/memory.api';

/**
 * Orders stored memory-fact records newest-first: ISO `createdAt` descending,
 * with undated records (missing timestamp) falling to the end. Returns a new
 * array and leaves the input untouched — the listing is read-only.
 */
export function buildSortedMemoryFacts(
  facts: readonly MemoryFactRecord[],
): MemoryFactRecord[] {
  return [...facts].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  );
}

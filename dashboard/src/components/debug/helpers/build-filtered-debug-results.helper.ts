import type { DebugResult } from '@/types/debug.model';

export type DebugResultFilter = 'all' | 'http' | 'socket';

export interface BuildFilteredDebugResultsOptions {
  filter: DebugResultFilter;
  hideRead: boolean;
  search: string;
  isRead: (id: string) => boolean;
}

function matchesSearch(result: DebugResult, search: string): boolean {
  const haystack = [
    result.endpoint,
    result.model,
    result.requestId,
    result.event,
    result.roomId,
    result.method,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search);
}

/**
 * The Request Log list: type filter + unread-only + text search, sorted
 * unread-first, then newest-first within each group.
 */
export function buildFilteredDebugResults(
  results: readonly DebugResult[],
  options: BuildFilteredDebugResultsOptions,
): DebugResult[] {
  const search = options.search.trim().toLowerCase();
  return results
    .filter((r) => options.filter === 'all' || r.type === options.filter)
    .filter((r) => !options.hideRead || !options.isRead(r.id))
    .filter((r) => !search || matchesSearch(r, search))
    .sort((a, b) => {
      const aRead = options.isRead(a.id);
      const bRead = options.isRead(b.id);
      if (aRead !== bRead) return aRead ? 1 : -1;
      return (b.epoch ?? 0) - (a.epoch ?? 0);
    });
}

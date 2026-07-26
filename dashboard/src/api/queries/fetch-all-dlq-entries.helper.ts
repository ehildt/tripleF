import { getApiUrl } from '@/api/api-url';
import type { DlqEntry } from '@/types/dlq-entry.model';

const PAGE_SIZE = 200;

export interface DlqEntriesSnapshot {
  entries: DlqEntry[];
  total: number;
}

/**
 * Fetch every DLQ entry (paged fan-out) for the unread-count badge.
 * Returns null on any failure — the badge simply stays stale.
 */
export async function fetchAllDlqEntries(): Promise<DlqEntriesSnapshot | null> {
  try {
    const first = await fetch(
      getApiUrl(`/api/v1/dlq?limit=${PAGE_SIZE}&offset=0`),
    );
    if (!first.ok) return null;

    const data = await first.json();
    const entries: DlqEntry[] = [...data.data];
    const pages = Math.ceil(data.total / PAGE_SIZE);

    if (pages > 1) {
      const fetches: Promise<DlqEntry[]>[] = [];
      for (let i = 1; i < pages; i++) {
        fetches.push(
          fetch(
            getApiUrl(`/api/v1/dlq?limit=${PAGE_SIZE}&offset=${i * PAGE_SIZE}`),
          ).then((r) =>
            r.ok ? r.json().then((d) => d.data as DlqEntry[]) : [],
          ),
        );
      }
      for (const page of await Promise.all(fetches)) entries.push(...page);
    }

    return { entries, total: data.total };
  } catch {
    return null;
  }
}

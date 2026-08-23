import type { DlqEntry } from '../../../../types/dlq-entry.model';

export function buildSortedDlqEntries(
  entries: readonly DlqEntry[],
  isRead: (entry: DlqEntry) => boolean,
  hideRead: boolean,
): DlqEntry[] {
  const timestamp = (e: DlqEntry) => e.failedAt ?? e.createdAt ?? '';

  const unread = entries
    .filter((e) => !isRead(e))
    .sort((a, b) => timestamp(b).localeCompare(timestamp(a)));

  if (hideRead) {
    return unread;
  }

  const read = entries
    .filter((e) => isRead(e))
    .sort((a, b) => timestamp(b).localeCompare(timestamp(a)));

  return [...unread, ...read];
}

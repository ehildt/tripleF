import { ref, watch } from 'vue';

import { useFrozenReadSnapshot } from '@/composables/use-frozen-read-snapshot';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { buildSortedDlqEntries } from '../helpers/build-sorted-dlq-entries.helper';
import type { UseDlqListStateOptions } from './use-dlq-list-state.types';

/**
 * Sorted DLQ entries on top of a frozen read snapshot: clicking an entry
 * marks it read immediately (badge counter, row styling) but never
 * re-orders the list. The unread-first sort and the hide-read filter only
 * re-evaluate the read state when the page data is replaced (pagination,
 * filters, manual refresh) or when the tab is reopened.
 */
export function useDlqListState(options: UseDlqListStateOptions) {
  const { entries, hideRead, isEntryRead, entryReadKey } = options;

  const { frozenReadKeys, refreshReadSnapshot } =
    useFrozenReadSnapshot<DlqEntry>({
      items: entries,
      itemKey: entryReadKey,
      isItemRead: isEntryRead,
    });

  const sortedEntries = ref<DlqEntry[]>([]);
  let lastPageFingerprint: string | null = null;

  function recomputeSort() {
    sortedEntries.value = buildSortedDlqEntries(
      entries.value,
      (entry) => frozenReadKeys.value.has(entryReadKey(entry)),
      hideRead.value,
    );
  }

  // Deep: the store mutates entries in place (splice on updateEntry). A
  // changed fingerprint means the list data was replaced — pagination,
  // filters, refresh — which are the only moments the read snapshot (and
  // with it the sort order) is re-evaluated.
  watch(
    entries,
    () => {
      const fingerprint = entries.value.map(entryReadKey).join('|');
      if (fingerprint !== lastPageFingerprint) {
        lastPageFingerprint = fingerprint;
        refreshReadSnapshot();
      }
      recomputeSort();
    },
    { immediate: true, deep: true },
  );

  watch(hideRead, () => {
    refreshReadSnapshot();
    recomputeSort();
  });

  return { sortedEntries };
}

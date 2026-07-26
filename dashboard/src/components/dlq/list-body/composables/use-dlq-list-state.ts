import type { Ref } from 'vue';
import { ref, watch } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { buildSortedDlqEntries } from '../helpers/build-sorted-dlq-entries.helper';

export interface UseDlqListStateOptions {
  entries: Ref<DlqEntry[]>;
  hideRead: Ref<boolean>;
  isEntryRead: (entry: DlqEntry) => boolean;
}

export function useDlqListState(options: UseDlqListStateOptions) {
  const { entries, hideRead, isEntryRead } = options;

  const sortedEntries = ref<DlqEntry[]>([]);

  function recomputeSort() {
    sortedEntries.value = buildSortedDlqEntries(
      entries.value,
      isEntryRead,
      hideRead.value,
    );
  }

  // Deep: the store mutates entries in place (splice on updateEntry).
  watch(entries, recomputeSort, { immediate: true, deep: true });
  watch(hideRead, recomputeSort);

  return { sortedEntries };
}

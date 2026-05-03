import type { Ref } from 'vue';
import { ref, watch } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { buildSortedDlqEntries } from '../helpers/build-sorted-dlq-entries.helper';

export interface UseDlqListStateOptions {
  entries: Ref<DlqEntry[]>;
  hideRead: Ref<boolean>;
  isEntryRead: (entry: DlqEntry) => boolean;
  sortTrigger?: Ref<number>;
}

export function useDlqListState(options: UseDlqListStateOptions) {
  const { entries, hideRead, isEntryRead, sortTrigger } = options;

  const sortedEntries = ref<DlqEntry[]>([]);

  function recomputeSort() {
    sortedEntries.value = buildSortedDlqEntries(
      entries.value,
      isEntryRead,
      hideRead.value,
    );
  }

  watch(entries, recomputeSort, { immediate: true });
  watch(hideRead, recomputeSort);
  if (sortTrigger) {
    watch(sortTrigger, recomputeSort);
  }

  return { sortedEntries };
}

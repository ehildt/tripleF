import { computed, ref, toRef, watch } from 'vue';

import { useFrozenReadSnapshot } from '../../../composables/use-frozen-read-snapshot';
import { useDebugStore } from '../../../stores/debug';
import type { DebugResult } from '../../../types/debug.model';
import type { DebugProps } from '../Debug.types';
import { buildFilteredDebugResults } from '../helpers/build-filtered-debug-results.helper';
import type { DebugResultFilter } from '../helpers/build-filtered-debug-results.helper.types';

/**
 * Owns the debug log's filter state: the type filter, text search, and
 * hide-read flag, plus the frozen read snapshot that keeps the list stable
 * under the cursor while rows are marked read.
 */
export function useDebugFilters(props: DebugProps) {
  const debugStore = useDebugStore();

  /** Composable-local state: type filter, text search, and hide-read flag. */
  const filter = ref<DebugResultFilter>('all');
  const search = ref('');
  const hideRead = ref(false);

  /**
   * Clicking an unread row marks it read immediately (badge counter, row
   * styling) but must not reshuffle the list under the user's cursor — the
   * unread-first sort and the hide-read filter read from a frozen snapshot
   * that refreshes on tab revisit and on explicit view changes only.
   */
  const { frozenReadKeys, refreshReadSnapshot } =
    useFrozenReadSnapshot<DebugResult>({
      items: toRef(props, 'results'),
      itemKey: (result) => result.id,
      isItemRead: (result) => debugStore.isDebugRead(result.id),
    });

  watch([filter, search, hideRead], refreshReadSnapshot);

  const filteredResults = computed(() =>
    buildFilteredDebugResults(props.results, {
      filter: filter.value,
      hideRead: hideRead.value,
      search: search.value,
      isRead: (id) => frozenReadKeys.value.has(id),
    }),
  );

  const hasHiddenRead = computed(
    () =>
      hideRead.value && props.results.some((r) => debugStore.isDebugRead(r.id)),
  );

  const httpCount = computed(
    () => props.results.filter((r) => r.type === 'http').length,
  );

  const socketCount = computed(
    () => props.results.filter((r) => r.type === 'socket').length,
  );

  return {
    filter,
    search,
    hideRead,
    filteredResults,
    hasHiddenRead,
    httpCount,
    socketCount,
  };
}

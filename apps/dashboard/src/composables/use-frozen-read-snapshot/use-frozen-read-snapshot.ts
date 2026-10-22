import { readonly, ref } from 'vue';

import type { UseFrozenReadSnapshotOptions } from './use-frozen-read-snapshot.types';

/**
 * Frozen copy of a list's read state. The live read tracker updates the
 * moment an item is clicked (badge counters, row styling), but sorting and
 * hide-read filtering read from this snapshot instead, so the list order
 * never reshuffles under the user's cursor. The snapshot is captured on
 * setup — i.e. every time the panel's tab is reopened — and again whenever
 * the consumer explicitly refreshes it (pagination, filter or search
 * changes).
 */
export function useFrozenReadSnapshot<T>(
  options: UseFrozenReadSnapshotOptions<T>,
) {
  const frozenReadKeys = ref<Set<string>>(new Set());

  function refreshReadSnapshot() {
    frozenReadKeys.value = new Set(
      options.items.value.filter(options.isItemRead).map(options.itemKey),
    );
  }

  refreshReadSnapshot();

  return {
    frozenReadKeys: readonly(frozenReadKeys),
    refreshReadSnapshot,
  };
}

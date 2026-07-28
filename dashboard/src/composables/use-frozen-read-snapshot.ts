import { readonly, type Ref, ref } from 'vue';

export interface UseFrozenReadSnapshotOptions<T> {
  /** The list rows currently available to the panel. */
  items: Readonly<Ref<readonly T[]>>;
  /** Stable identity of one row, matching the live read tracker's key. */
  itemKey: (item: T) => string;
  /** Live read check — reflects clicks immediately. */
  isItemRead: (item: T) => boolean;
}

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

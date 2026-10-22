import { ref } from 'vue';

/**
 * The synopsis tree's expand/collapse state — a module-scope singleton (the
 * synopsis is one view; every recursive tree node reads the same set, which
 * is what recursive folding needs without threading props through the
 * recursion). A scope refetch re-seeds: root rows open, deeper levels
 * collapsed, so the first read is always a usable overview.
 */
const expandedIds = ref<ReadonlySet<string>>(new Set());

export function useSynopsisTree() {
  function isExpanded(id: string): boolean {
    return expandedIds.value.has(id);
  }

  function toggle(id: string): void {
    const next = new Set(expandedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedIds.value = next;
  }

  /** Replace the expanded set after a refetch (root ids stay open). */
  function seedExpanded(ids: readonly string[]): void {
    expandedIds.value = new Set(ids);
  }

  return { isExpanded, toggle, seedExpanded };
}

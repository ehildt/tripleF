import { ref } from 'vue';

/**
 * The synopsis tree's expand/collapse state — a module-scope singleton (the
 * synopsis is one view; every recursive tree node reads the same set, which
 * is what recursive folding needs without threading props through the
 * recursion). Everything starts collapsed: each row shows only its head
 * (title, level, members); expanding reveals the summary and children.
 * A refetch resets back to collapsed so the first read is a compact list.
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

  /** Collapse every row after a refetch (fresh data starts fully folded). */
  function resetExpanded(): void {
    expandedIds.value = new Set();
  }

  return { isExpanded, toggle, resetExpanded };
}

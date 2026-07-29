import { ref } from 'vue';

/**
 * Collapsed state of the two model groups in the selector dropdown. Both
 * groups start expanded; the section divider toggles its group. Scoped to
 * the ModelList instance — reopening the menu shows full groups again.
 */
export function useModelListGroups() {
  const localCollapsed = ref(false);
  const cloudCollapsed = ref(false);

  function toggleLocal() {
    localCollapsed.value = !localCollapsed.value;
  }

  function toggleCloud() {
    cloudCollapsed.value = !cloudCollapsed.value;
  }

  return { localCollapsed, cloudCollapsed, toggleLocal, toggleCloud };
}

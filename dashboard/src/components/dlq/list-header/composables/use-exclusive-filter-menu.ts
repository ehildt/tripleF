import { onClickOutside } from '@vueuse/core';
import { type Ref, ref } from 'vue';

export type DlqFilterMenuId = 'status' | 'search';

export function useExclusiveFilterMenu(
  containerRef: Ref<HTMLElement | null>,
  menuIds: readonly DlqFilterMenuId[],
) {
  const openMenus = ref<Set<DlqFilterMenuId>>(new Set());

  function isKnownMenuId(id: string): id is DlqFilterMenuId {
    return (menuIds as readonly string[]).includes(id);
  }

  function toggleMenu(id: DlqFilterMenuId) {
    if (!isKnownMenuId(id)) return;
    const next = new Set<DlqFilterMenuId>();
    if (!openMenus.value.has(id)) {
      next.add(id);
    }
    openMenus.value = next;
  }

  function closeAllMenus() {
    openMenus.value = new Set();
  }

  function isMenuOpen(id: DlqFilterMenuId): boolean {
    return openMenus.value.has(id);
  }

  onClickOutside(containerRef, closeAllMenus);

  return {
    isMenuOpen,
    toggleMenu,
    closeAllMenus,
  };
}

import { ref } from 'vue';

import type { DlqFilterMenuId } from './use-exclusive-filter-menu.types';

/**
 * Open state for the DLQ list-header's filter menus: at most one menu is
 * open at a time. Each menu's trigger owns the transparent backdrop that
 * requests closure — no coordinator-level onClickOutside.
 */
export function useExclusiveFilterMenu(menuIds: readonly DlqFilterMenuId[]) {
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

  return {
    isMenuOpen,
    toggleMenu,
    closeAllMenus,
  };
}

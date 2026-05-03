import { onMounted, onUnmounted, type Ref, ref } from 'vue';

export type DlqFilterMenuId = 'status' | 'queue' | 'search';

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

  function handleDocumentClick(e: MouseEvent) {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
      closeAllMenus();
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick);
  });

  return {
    isMenuOpen,
    toggleMenu,
    closeAllMenus,
  };
}

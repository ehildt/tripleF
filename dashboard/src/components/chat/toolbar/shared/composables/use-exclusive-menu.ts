import { computed, ref } from 'vue';

/**
 * Manages a set of menus where only one can be open at a time.
 * Opening one menu automatically closes any other.
 */
export function useExclusiveMenu() {
  const openMenuKey = ref<string | null>(null);

  function isMenuOpen(key: string) {
    return computed(() => openMenuKey.value === key);
  }

  function toggleMenu(key: string) {
    openMenuKey.value = openMenuKey.value === key ? null : key;
  }

  function openMenu(key: string) {
    openMenuKey.value = key;
  }

  function closeAllMenus() {
    openMenuKey.value = null;
  }

  return {
    openMenuKey,
    isMenuOpen,
    toggleMenu,
    openMenu,
    closeAllMenus,
  };
}

import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { computed, type Ref, ref } from 'vue';

import { tabMenuAutoClose, tabMenuSide } from './tab-menu-settings.state';

/**
 * Slide-out behavior of the tab menu: the drawer starts open and stays open
 * until the user toggles the edge handle (or presses Escape) — togglable by
 * default. With autoclose on (Settings → Widgets → Tab Menu), the drawer also
 * closes itself after a tab was picked or a click landed outside the menu.
 * The menu is docked to the configured screen edge; it is fixed to that
 * edge and cannot be dragged.
 */
export function useTabMenu(menuRef: Ref<HTMLElement | null>) {
  const isOpen = ref(true);

  const side = computed(() => tabMenuSide.value);

  function toggleMenu() {
    isOpen.value = !isOpen.value;
  }

  function closeMenu() {
    isOpen.value = false;
  }

  /** Close after an action inside the drawer — only when autoclose is on. */
  function closeOnAutoclose() {
    if (tabMenuAutoClose.value) closeMenu();
  }

  onClickOutside(menuRef, () => {
    if (tabMenuAutoClose.value) closeMenu();
  });

  onKeyStroke('Escape', () => {
    if (isOpen.value) closeMenu();
  });

  return { isOpen, side, toggleMenu, closeOnAutoclose };
}

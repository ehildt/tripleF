import { computed, onUnmounted, ref } from 'vue';

import type { HeaderMenuProps } from '../HeaderMenu.types';

export interface HeaderMenuEmits {
  (e: 'update:filter', value: HeaderMenuProps['filter']): void;
  (e: 'update:hideRead', value: boolean): void;
  (e: 'clear'): void;
}

/**
 * Owns the debug header menu's interaction state: the search popover
 * open/close, the per-filter disabled flags, and the armed two-step clear.
 */
export function useHeaderMenu(props: HeaderMenuProps, emit: HeaderMenuEmits) {
  const isSearchOpen = ref(false);

  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value;
  }

  function closeSearch() {
    isSearchOpen.value = false;
  }

  const disableAll = computed(() => props.allCount === 0);
  const disableHttp = computed(() => props.httpCount === 0);
  const disableSocket = computed(() => props.socketCount === 0);

  /** Clear wipes the whole log — arm first, second click within 3 s executes. */
  const clearArmed = ref(false);
  let clearArmTimer: ReturnType<typeof setTimeout> | null = null;

  function handleClearClick() {
    if (clearArmed.value) {
      disarmClear();
      emit('clear');
      return;
    }
    clearArmed.value = true;
    clearArmTimer = setTimeout(() => {
      clearArmed.value = false;
    }, 3000);
  }

  function disarmClear() {
    clearArmed.value = false;
    if (clearArmTimer) clearTimeout(clearArmTimer);
    clearArmTimer = null;
  }

  onUnmounted(disarmClear);

  return {
    isSearchOpen,
    toggleSearch,
    closeSearch,
    disableAll,
    disableHttp,
    disableSocket,
    clearArmed,
    handleClearClick,
  };
}

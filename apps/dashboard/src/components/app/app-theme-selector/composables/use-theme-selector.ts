import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { computed, ref } from 'vue';

import {
  type ThemeName,
  THEMES,
  useThemeStore,
} from '../../../../stores/theme';

export function useThemeSelector() {
  const store = useThemeStore();
  const isDropdownOpen = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
  }

  function closeDropdown() {
    isDropdownOpen.value = false;
  }

  function selectTheme(key: ThemeName) {
    store.currentTheme = key;
  }

  onClickOutside(containerRef, () => {
    if (isDropdownOpen.value) closeDropdown();
  });
  onKeyStroke('Escape', () => {
    if (isDropdownOpen.value) closeDropdown();
  });

  return {
    containerRef,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    themes: THEMES,
    currentTheme: computed(() => store.currentTheme),
    isDarkMode: computed(() => store.isDarkMode),
    selectTheme,
    toggleDarkMode: store.toggleDarkMode,
  };
}

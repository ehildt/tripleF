import { computed, onMounted, onUnmounted, ref } from 'vue';

import {
  type ThemeName,
  THEMES,
  useThemeStore,
} from '../../../../stores/theme';

export function useThemeSelector() {
  const store = useThemeStore();
  const isDropdownOpen = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  const currentPrimary = computed(
    () =>
      THEMES.find((t) => t.key === store.currentTheme)?.primary ??
      'var(--color-accent-primary)',
  );

  function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value;
  }

  function closeDropdown() {
    isDropdownOpen.value = false;
  }

  function selectTheme(key: ThemeName) {
    store.currentTheme = key;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isDropdownOpen.value) {
      closeDropdown();
    }
  }

  function onDocumentClick(e: MouseEvent) {
    if (
      isDropdownOpen.value &&
      !containerRef.value?.contains(e.target as Node)
    ) {
      closeDropdown();
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onDocumentClick);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onDocumentClick);
  });

  return {
    containerRef,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    currentPrimary,
    themes: THEMES,
    currentTheme: computed(() => store.currentTheme),
    isDarkMode: computed(() => store.isDarkMode),
    selectTheme,
    toggleDarkMode: store.toggleDarkMode,
  };
}

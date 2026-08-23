import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const THEMES = [
  { key: 'gothic', name: 'Gothic' },
  { key: 'pragmata', name: 'Pragmata' },
  { key: 'souls', name: 'Dark Souls' },
  { key: 'residentevil', name: 'Resident Evil' },
  { key: 'cyberpunk', name: 'Cyberpunk 2077' },
  { key: 'baldursgate', name: "Baldur's Gate" },
  { key: 'stellar', name: 'Stellar Blade' },
  { key: 'deathspace', name: 'Dead Space' },
  { key: 'wuchang', name: 'Wuchang' },
  { key: 'nioh', name: 'Nioh' },
] as const;

export type ThemeName = (typeof THEMES)[number]['key'];

export const DEFAULT_THEME: ThemeName = 'stellar';

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeName>(DEFAULT_THEME);
  const isDarkMode = ref(true);

  function applyTheme(theme: ThemeName) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function applyMode(dark: boolean) {
    document.documentElement.setAttribute(
      'data-theme-mode',
      dark ? 'dark' : 'light',
    );
  }

  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved && THEMES.some((t) => t.key === saved)) {
      currentTheme.value = saved as ThemeName;
    }

    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'light' || savedMode === 'dark') {
      isDarkMode.value = savedMode === 'dark';
    }

    applyTheme(currentTheme.value);
    applyMode(isDarkMode.value);
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
  }

  watch(currentTheme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  watch(isDarkMode, (dark) => {
    localStorage.setItem('theme-mode', dark ? 'dark' : 'light');
    applyMode(dark);
  });

  return {
    currentTheme,
    isDarkMode,
    initTheme,
    toggleDarkMode,
  };
});

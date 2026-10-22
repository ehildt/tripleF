import { ref, watch } from 'vue';

import {
  DEFAULT_THEME,
  THEME_MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type ThemeName,
  THEMES,
} from './theme.constant';

/**
 * Current palette and dark/light mode, with persistence to localStorage and
 * application to the `<html>` data attributes the CSS palettes/modes select
 * on. Module-scope singleton (rule 20): one theme applies to the whole app,
 * so every caller sees the same refs. The spec resets the refs, localStorage,
 * and the html attributes between tests. This used to be a Pinia store; it
 * only controlled DOM attributes, so per convention it is a composable.
 */
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

watch(currentTheme, (newTheme) => {
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  applyTheme(newTheme);
});

watch(isDarkMode, (dark) => {
  localStorage.setItem(THEME_MODE_STORAGE_KEY, dark ? 'dark' : 'light');
  applyMode(dark);
});

export function useTheme() {
  /** Hydrate from localStorage and apply both attributes. Call once at app
   * startup. */
  function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some((t) => t.key === saved)) {
      currentTheme.value = saved as ThemeName;
    }

    const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (savedMode === 'light' || savedMode === 'dark') {
      isDarkMode.value = savedMode === 'dark';
    }

    applyTheme(currentTheme.value);
    applyMode(isDarkMode.value);
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
  }

  return {
    currentTheme,
    isDarkMode,
    initTheme,
    toggleDarkMode,
  };
}

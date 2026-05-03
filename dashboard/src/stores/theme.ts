import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const THEMES = [
  { key: 'yakuza', name: 'Yakuza', primary: '#00b8a9' },
  { key: 'gothic', name: 'Gothic', primary: '#7d6e63' },
  { key: 'pragmata', name: 'Pragmata', primary: '#4a6de5' },
  { key: 'souls', name: 'Dark Souls', primary: '#e6a23c' },
  { key: 'residentevil', name: 'Resident Evil', primary: '#c0392b' },
  { key: 'cyberpunk', name: 'Cyberpunk 2077', primary: '#1abc9c' },
  { key: 'ghostwire', name: 'Ghostwire Tokyo', primary: '#1dd1a1' },
  { key: 'baldursgate', name: "Baldur's Gate", primary: '#8b5cf6' },
  { key: 'stellar', name: 'Stellar Blade', primary: '#e84393' },
  { key: 'deathspace', name: 'Dead Space', primary: '#8e44ad' },
  { key: 'wuchang', name: 'Wuchang', primary: '#a8a8a8' },
  { key: 'wukong', name: 'Wukong', primary: '#00a86b' },
  { key: 'nioh', name: 'Nioh', primary: '#e74c3c' },
] as const;

export type ThemeName = (typeof THEMES)[number]['key'];

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeName>('souls');
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

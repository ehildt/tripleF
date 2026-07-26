import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { THEMES, useThemeStore } from './theme';

describe('THEMES', () => {
  it('includes all 13 themes', () => {
    expect(THEMES.length).toBe(13);
  });

  it('each theme has key and name', () => {
    for (const theme of THEMES) {
      expect(theme.key).toBeTruthy();
      expect(theme.name).toBeTruthy();
    }
  });
});

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
  });

  it('has default theme souls', () => {
    const store = useThemeStore();
    expect(store.currentTheme).toBe('souls');
  });

  it('is dark mode by default', () => {
    const store = useThemeStore();
    expect(store.isDarkMode).toBe(true);
  });

  it('initTheme loads valid saved theme', () => {
    localStorage.setItem('theme', 'residentevil');
    const store = useThemeStore();
    store.initTheme();
    expect(store.currentTheme).toBe('residentevil');
  });

  it('initTheme ignores invalid saved theme', () => {
    localStorage.setItem('theme', 'invalid');
    const store = useThemeStore();
    store.initTheme();
    expect(store.currentTheme).toBe('souls');
  });

  it('initTheme restores saved mode', () => {
    localStorage.setItem('theme-mode', 'light');
    const store = useThemeStore();
    store.initTheme();
    expect(store.isDarkMode).toBe(false);
  });

  it('toggleDarkMode flips the mode', () => {
    const store = useThemeStore();
    expect(store.isDarkMode).toBe(true);
    store.toggleDarkMode();
    expect(store.isDarkMode).toBe(false);
    store.toggleDarkMode();
    expect(store.isDarkMode).toBe(true);
  });

  it('watch persists theme to localStorage and applies it', async () => {
    const store = useThemeStore();
    store.currentTheme = 'nioh';
    await new Promise((r) => setTimeout(r, 10));
    expect(localStorage.getItem('theme')).toBe('nioh');
    expect(document.documentElement.getAttribute('data-theme')).toBe('nioh');
  });

  it('watch persists mode to localStorage and applies it', async () => {
    const store = useThemeStore();
    store.toggleDarkMode();
    await new Promise((r) => setTimeout(r, 10));
    expect(localStorage.getItem('theme-mode')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe(
      'light',
    );
  });
});

import { beforeEach, describe, expect, it } from 'vitest';

import { THEMES } from './theme.constant';
import { THEME_MODE_STORAGE_KEY, THEME_STORAGE_KEY } from './theme.constant';
import { useTheme } from './use-theme';

describe('THEMES', () => {
  it('includes all 10 themes', () => {
    expect(THEMES).toHaveLength(10);
  });

  it('each theme has key and name', () => {
    for (const theme of THEMES) {
      expect(theme.key).toBeTruthy();
      expect(theme.name).toBeTruthy();
    }
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    // Module-scope singleton: reset the shared refs, localStorage, and the
    // html attributes between tests.
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
    const theme = useTheme();
    theme.currentTheme.value = 'stellar';
    theme.isDarkMode.value = true;
  });

  it('has default theme stellar', () => {
    const theme = useTheme();
    expect(theme.currentTheme.value).toBe('stellar');
  });

  it('is dark mode by default', () => {
    const theme = useTheme();
    expect(theme.isDarkMode.value).toBe(true);
  });

  it('initTheme loads valid saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'residentevil');
    const theme = useTheme();
    theme.initTheme();
    expect(theme.currentTheme.value).toBe('residentevil');
  });

  it('initTheme ignores invalid saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid');
    const theme = useTheme();
    theme.initTheme();
    expect(theme.currentTheme.value).toBe('stellar');
  });

  it('initTheme restores saved mode', () => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light');
    const theme = useTheme();
    theme.initTheme();
    expect(theme.isDarkMode.value).toBe(false);
  });

  it('toggleDarkMode flips the mode', () => {
    const theme = useTheme();
    expect(theme.isDarkMode.value).toBe(true);
    theme.toggleDarkMode();
    expect(theme.isDarkMode.value).toBe(false);
    theme.toggleDarkMode();
    expect(theme.isDarkMode.value).toBe(true);
  });

  it('watch persists theme to localStorage and applies it', async () => {
    const theme = useTheme();
    theme.currentTheme.value = 'nioh';
    await new Promise((r) => setTimeout(r, 10));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('nioh');
    expect(document.documentElement.getAttribute('data-theme')).toBe('nioh');
  });

  it('watch persists mode to localStorage and applies it', async () => {
    const theme = useTheme();
    theme.toggleDarkMode();
    await new Promise((r) => setTimeout(r, 10));
    expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe(
      'light',
    );
  });
});

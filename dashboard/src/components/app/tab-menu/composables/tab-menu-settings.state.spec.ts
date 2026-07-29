import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetTabMenuSettings,
  setTabMenuAutoClose,
  setTabMenuSide,
  tabMenuAutoClose,
  tabMenuSide,
} from './tab-menu-settings.state';

describe('tab-menu-settings.state', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTabMenuSettings();
  });

  it('loads defaults when nothing is stored', async () => {
    vi.resetModules();
    const mod = await import('./tab-menu-settings.state');
    expect(mod.tabMenuSide.value).toBe('right');
    expect(mod.tabMenuAutoClose.value).toBe(false);
  });

  it('hydrates the settings from localStorage', async () => {
    localStorage.setItem('vision-tab-menu-side', 'left');
    localStorage.setItem('vision-tab-menu-auto-close', 'true');
    vi.resetModules();
    const mod = await import('./tab-menu-settings.state');
    expect(mod.tabMenuSide.value).toBe('left');
    expect(mod.tabMenuAutoClose.value).toBe(true);
  });

  it('falls back to the default side for an unknown stored value', async () => {
    localStorage.setItem('vision-tab-menu-side', 'bottom');
    vi.resetModules();
    const mod = await import('./tab-menu-settings.state');
    expect(mod.tabMenuSide.value).toBe('right');
  });

  it('persists side changes', () => {
    setTabMenuSide('left');
    expect(tabMenuSide.value).toBe('left');
    expect(localStorage.getItem('vision-tab-menu-side')).toBe('left');
  });

  it('persists autoclose changes', () => {
    setTabMenuAutoClose(true);
    expect(tabMenuAutoClose.value).toBe(true);
    expect(localStorage.getItem('vision-tab-menu-auto-close')).toBe('true');
  });

  it('reset restores the defaults', () => {
    setTabMenuSide('left');
    setTabMenuAutoClose(true);
    resetTabMenuSettings();
    expect(tabMenuSide.value).toBe('right');
    expect(tabMenuAutoClose.value).toBe(false);
    expect(localStorage.getItem('vision-tab-menu-side')).toBe('right');
    expect(localStorage.getItem('vision-tab-menu-auto-close')).toBe('false');
  });
});

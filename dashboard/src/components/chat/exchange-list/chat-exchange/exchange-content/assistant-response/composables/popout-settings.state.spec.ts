import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  popoutAutoDock,
  popoutPreviewVisible,
  popoutShowBarAlways,
  resetPopoutSettings,
  setPopoutAutoDock,
  setPopoutShowBarAlways,
  togglePopoutPreview,
} from './popout-settings.state';

describe('popout-settings.state', () => {
  beforeEach(() => {
    localStorage.clear();
    setPopoutAutoDock(true);
  });

  it('loads the default when nothing is stored', async () => {
    vi.resetModules();
    const mod = await import('./popout-settings.state');
    expect(mod.popoutAutoDock.value).toBe(true);
  });

  it('hydrates the setting from localStorage', async () => {
    localStorage.setItem('vision-popout-auto-dock', 'false');
    vi.resetModules();
    const mod = await import('./popout-settings.state');
    expect(mod.popoutAutoDock.value).toBe(false);
  });

  it('persists autodock changes', () => {
    setPopoutAutoDock(false);
    expect(popoutAutoDock.value).toBe(false);
    expect(localStorage.getItem('vision-popout-auto-dock')).toBe('false');
  });

  it('reset restores the setting to its default', () => {
    setPopoutAutoDock(false);
    resetPopoutSettings();
    expect(popoutAutoDock.value).toBe(true);
    expect(localStorage.getItem('vision-popout-auto-dock')).toBe('true');
  });

  it('togglePopoutPreview flips the preview on and off', () => {
    expect(popoutPreviewVisible.value).toBe(false);
    togglePopoutPreview();
    expect(popoutPreviewVisible.value).toBe(true);
    togglePopoutPreview();
    expect(popoutPreviewVisible.value).toBe(false);
  });

  it('defaults to keeping the bar always visible and persists changes', () => {
    expect(popoutShowBarAlways.value).toBe(true);
    setPopoutShowBarAlways(false);
    expect(popoutShowBarAlways.value).toBe(false);
    expect(localStorage.getItem('vision-popout-show-bar-always')).toBe('false');
  });
});

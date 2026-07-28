import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  popoutAutoDock,
  popoutStopOnClose,
  resetPopoutSettings,
  setPopoutAutoDock,
  setPopoutStopOnClose,
} from './popout-settings.state';

describe('popout-settings.state', () => {
  beforeEach(() => {
    localStorage.clear();
    setPopoutAutoDock(true);
    setPopoutStopOnClose(false);
  });

  it('loads defaults when nothing is stored', async () => {
    vi.resetModules();
    const mod = await import('./popout-settings.state');
    expect(mod.popoutAutoDock.value).toBe(true);
    expect(mod.popoutStopOnClose.value).toBe(false);
  });

  it('hydrates the new settings from localStorage', async () => {
    localStorage.setItem('vision-popout-auto-dock', 'false');
    localStorage.setItem('vision-popout-stop-on-close', 'true');
    vi.resetModules();
    const mod = await import('./popout-settings.state');
    expect(mod.popoutAutoDock.value).toBe(false);
    expect(mod.popoutStopOnClose.value).toBe(true);
  });

  it('persists autodock changes', () => {
    setPopoutAutoDock(false);
    expect(popoutAutoDock.value).toBe(false);
    expect(localStorage.getItem('vision-popout-auto-dock')).toBe('false');
  });

  it('persists stop-on-close changes', () => {
    setPopoutStopOnClose(true);
    expect(popoutStopOnClose.value).toBe(true);
    expect(localStorage.getItem('vision-popout-stop-on-close')).toBe('true');
  });

  it('reset restores both new settings to their defaults', () => {
    setPopoutAutoDock(false);
    setPopoutStopOnClose(true);
    resetPopoutSettings();
    expect(popoutAutoDock.value).toBe(true);
    expect(popoutStopOnClose.value).toBe(false);
    expect(localStorage.getItem('vision-popout-auto-dock')).toBe('true');
    expect(localStorage.getItem('vision-popout-stop-on-close')).toBe('false');
  });
});

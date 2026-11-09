import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePopoutSettingsStore } from './popout-settings.store';

describe('usePopoutSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with the defaults', () => {
    const store = usePopoutSettingsStore();
    expect(store.popoutEnabled).toBe(true);
    expect(store.popoutAnchor).toBe('bottom-right');
    expect(store.popoutRememberPosition).toBe(true);
    expect(store.popoutHideOnPlaylist).toBe(false);
    expect(store.popoutAutoDock).toBe(true);
    expect(store.popoutShowBarAlways).toBe(true);
    expect(store.floatingPopupRect).toBeNull();
  });

  it('hydrates the enabled flag from storage', () => {
    localStorage.setItem('vision-popout-enabled', 'false');
    expect(usePopoutSettingsStore().popoutEnabled).toBe(false);
  });

  it('ignores an invalid stored anchor', () => {
    localStorage.setItem('vision-popout-anchor', 'somewhere-else');
    expect(usePopoutSettingsStore().popoutAnchor).toBe('bottom-right');
  });

  it('changing the anchor drops any remembered position', () => {
    const store = usePopoutSettingsStore();
    store.floatingPopupRect = { x: 1, y: 2, width: 3, height: 4 };
    store.setPopoutAnchor('top-left');
    expect(store.popoutAnchor).toBe('top-left');
    expect(store.floatingPopupRect).toBeNull();
  });

  it('persists the popup rect only while position memory is on', () => {
    const store = usePopoutSettingsStore();
    store.floatingPopupRect = { x: 10, y: 20, width: 300, height: 200 };
    store.rememberFloatingPopupRect();
    expect(
      JSON.parse(localStorage.getItem('vision-popout-rect') ?? 'null'),
    ).toEqual({ x: 10, y: 20, width: 300, height: 200 });

    store.setPopoutRememberPosition(false);
    localStorage.removeItem('vision-popout-rect');
    store.floatingPopupRect = { x: 1, y: 2, width: 3, height: 4 };
    store.rememberFloatingPopupRect();
    expect(localStorage.getItem('vision-popout-rect')).toBeNull();
  });

  it('releaseFloatingPopupRect keeps a remembered position', () => {
    const store = usePopoutSettingsStore();
    store.floatingPopupRect = { x: 1, y: 2, width: 3, height: 4 };
    store.releaseFloatingPopupRect();
    expect(store.floatingPopupRect).not.toBeNull();

    store.setPopoutRememberPosition(false);
    store.releaseFloatingPopupRect();
    expect(store.floatingPopupRect).toBeNull();
  });

  it('resets every setting back to the defaults', () => {
    const store = usePopoutSettingsStore();
    store.setPopoutEnabled(false);
    store.setPopoutAnchor('top-right');
    store.setPopoutHideOnPlaylist(true);
    store.setPopoutAutoDock(false);
    store.setPopoutShowBarAlways(false);

    store.resetPopoutSettings();

    expect(store.popoutEnabled).toBe(true);
    expect(store.popoutAnchor).toBe('bottom-right');
    expect(store.popoutHideOnPlaylist).toBe(false);
    expect(store.popoutAutoDock).toBe(true);
    expect(store.popoutShowBarAlways).toBe(true);
  });
});

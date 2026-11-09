import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePopoutSettingsStore } from './popout-settings.store';

describe('usePopoutSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with the preference defaults', () => {
    const store = usePopoutSettingsStore();

    expect(store.popoutEnabled).toBe(true);
    expect(store.popoutAnchor).toBe('bottom-right');
    expect(store.popoutRememberPosition).toBe(true);
    expect(store.popoutHideOnPlaylist).toBe(false);
    expect(store.popoutAutoDock).toBe(true);
    expect(store.popoutShowBarAlways).toBe(true);
  });

  it('hydrates persisted boolean preferences and anchor', () => {
    localStorage.setItem('vision-popout-enabled', 'false');
    localStorage.setItem('vision-popout-remember-position', 'false');
    localStorage.setItem('vision-popout-hide-on-playlist', 'true');
    localStorage.setItem('vision-popout-auto-dock', 'false');
    localStorage.setItem('vision-popout-show-bar-always', 'false');
    localStorage.setItem('vision-popout-anchor', 'top-left');

    const store = usePopoutSettingsStore();

    expect(store.popoutEnabled).toBe(false);
    expect(store.popoutRememberPosition).toBe(false);
    expect(store.popoutHideOnPlaylist).toBe(true);
    expect(store.popoutAutoDock).toBe(false);
    expect(store.popoutShowBarAlways).toBe(false);
    expect(store.popoutAnchor).toBe('top-left');
  });

  it('ignores an invalid stored anchor', () => {
    localStorage.setItem('vision-popout-anchor', 'somewhere-else');
    expect(usePopoutSettingsStore().popoutAnchor).toBe('bottom-right');
  });

  it('persists every preference setter', () => {
    const store = usePopoutSettingsStore();

    store.setPopoutEnabled(false);
    store.setPopoutAnchor('top-right');
    store.setPopoutRememberPosition(false);
    store.setPopoutHideOnPlaylist(true);
    store.setPopoutAutoDock(false);
    store.setPopoutShowBarAlways(false);

    expect(localStorage.getItem('vision-popout-enabled')).toBe('false');
    expect(localStorage.getItem('vision-popout-anchor')).toBe('top-right');
    expect(localStorage.getItem('vision-popout-remember-position')).toBe(
      'false',
    );
    expect(localStorage.getItem('vision-popout-hide-on-playlist')).toBe('true');
    expect(localStorage.getItem('vision-popout-auto-dock')).toBe('false');
    expect(localStorage.getItem('vision-popout-show-bar-always')).toBe('false');
  });

  it('resets every preference back to its default', () => {
    const store = usePopoutSettingsStore();
    store.setPopoutEnabled(false);
    store.setPopoutAnchor('top-right');
    store.setPopoutRememberPosition(false);
    store.setPopoutHideOnPlaylist(true);
    store.setPopoutAutoDock(false);
    store.setPopoutShowBarAlways(false);

    store.resetPopoutSettings();

    expect(store.popoutEnabled).toBe(true);
    expect(store.popoutAnchor).toBe('bottom-right');
    expect(store.popoutRememberPosition).toBe(true);
    expect(store.popoutHideOnPlaylist).toBe(false);
    expect(store.popoutAutoDock).toBe(true);
    expect(store.popoutShowBarAlways).toBe(true);
  });
});

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePopoutSettingsStore } from '@/stores/widgets/popout-settings/popout-settings.store';

import { usePopoutSettings } from './use-popout-settings';

const { clearFloatingPopupRectMock } = vi.hoisted(() => ({
  clearFloatingPopupRectMock: vi.fn(),
}));

vi.mock('@/composables/use-playback-session/use-playback-session', () => ({
  usePlaybackSession: () => ({
    clearFloatingPopupRect: clearFloatingPopupRectMock,
  }),
}));

describe('usePopoutSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    clearFloatingPopupRectMock.mockClear();
  });

  it('changes the anchor and clears dependent geometry', () => {
    usePopoutSettings().setPopoutAnchor('top-left');

    expect(usePopoutSettingsStore().popoutAnchor).toBe('top-left');
    expect(localStorage.getItem('vision-popout-anchor')).toBe('top-left');
    expect(clearFloatingPopupRectMock).toHaveBeenCalledTimes(1);
  });

  it('clears geometry only when position memory is disabled', () => {
    const settings = usePopoutSettings();

    settings.setPopoutRememberPosition(true);
    expect(clearFloatingPopupRectMock).not.toHaveBeenCalled();

    settings.setPopoutRememberPosition(false);
    expect(usePopoutSettingsStore().popoutRememberPosition).toBe(false);
    expect(clearFloatingPopupRectMock).toHaveBeenCalledTimes(1);
  });

  it('resets preferences and clears geometry once', () => {
    const store = usePopoutSettingsStore();
    store.setPopoutEnabled(false);
    store.setPopoutAnchor('top-right');
    store.setPopoutRememberPosition(false);
    store.setPopoutHideOnPlaylist(true);
    store.setPopoutAutoDock(false);
    store.setPopoutShowBarAlways(false);

    usePopoutSettings().resetPopoutSettings();

    expect(store.popoutEnabled).toBe(true);
    expect(store.popoutAnchor).toBe('bottom-right');
    expect(store.popoutRememberPosition).toBe(true);
    expect(store.popoutHideOnPlaylist).toBe(false);
    expect(store.popoutAutoDock).toBe(true);
    expect(store.popoutShowBarAlways).toBe(true);
    expect(clearFloatingPopupRectMock).toHaveBeenCalledTimes(1);
  });
});

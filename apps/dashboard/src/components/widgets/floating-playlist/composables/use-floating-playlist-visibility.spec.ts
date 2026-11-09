import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';

import { useFloatingPlaylistOpen } from './use-floating-playlist-open';
import { useFloatingPlaylistVisibility } from './use-floating-playlist-visibility';

const { onClickOutsideMock, onKeyStrokeMock } = vi.hoisted(() => ({
  onClickOutsideMock: vi.fn(),
  onKeyStrokeMock: vi.fn(),
}));

vi.mock('@vueuse/core', () => ({
  onClickOutside: onClickOutsideMock,
  onKeyStroke: onKeyStrokeMock,
}));

type VisibilityListener = () => void;

function getListener(mock: ReturnType<typeof vi.fn>): VisibilityListener {
  return mock.mock.calls[0][1] as VisibilityListener;
}

describe('useFloatingPlaylistVisibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    onClickOutsideMock.mockClear();
    onKeyStrokeMock.mockClear();
    useFloatingPlaylistOpen().closeFloatingPlaylist();
  });

  it('registers one outside-click and one Escape listener', () => {
    useFloatingPlaylistVisibility(ref<HTMLElement | null>(null));

    expect(onClickOutsideMock).toHaveBeenCalledTimes(1);
    expect(onKeyStrokeMock).toHaveBeenCalledTimes(1);
    expect(onKeyStrokeMock.mock.calls[0][0]).toBe('Escape');
  });

  it('closes on outside clicks and internal actions only with autoclose', () => {
    const floating = useFloatingPlaylistOpen();
    const settings = usePlaylistSettingsStore();
    const visibility = useFloatingPlaylistVisibility(
      ref<HTMLElement | null>(null),
    );
    const outsideClick = getListener(onClickOutsideMock);

    floating.openFloatingPlaylist();
    outsideClick();
    expect(floating.floatingPlaylistOpen.value).toBe(true);

    settings.setPlaylistAutoClose(true);
    outsideClick();
    expect(floating.floatingPlaylistOpen.value).toBe(false);

    floating.openFloatingPlaylist();
    visibility.closeOnAutoclose();
    expect(floating.floatingPlaylistOpen.value).toBe(false);
  });

  it('closes an open window on Escape regardless of autoclose', () => {
    const floating = useFloatingPlaylistOpen();
    useFloatingPlaylistVisibility(ref<HTMLElement | null>(null));
    const escape = getListener(onKeyStrokeMock);

    floating.openFloatingPlaylist();
    escape();

    expect(floating.floatingPlaylistOpen.value).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import {
  floatingPlaylistOpen,
  playlistAutoClose,
} from './playlist-settings.state';
import { useFloatingPlaylistVisibility } from './use-floating-playlist-visibility';

function keydownEscape() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
}

describe('useFloatingPlaylistVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    floatingPlaylistOpen.value = true;
    playlistAutoClose.value = false;
  });

  it('toggles the window open and closed', () => {
    const visibility = useFloatingPlaylistVisibility(ref(null));
    visibility.closePlaylist();
    expect(floatingPlaylistOpen.value).toBe(false);
    visibility.togglePlaylist();
    expect(floatingPlaylistOpen.value).toBe(true);
  });

  it('collapses on Escape', () => {
    useFloatingPlaylistVisibility(ref(null));
    keydownEscape();
    expect(floatingPlaylistOpen.value).toBe(false);
  });

  it('autoclose: closing after a pick only applies when enabled', () => {
    const visibility = useFloatingPlaylistVisibility(ref(null));
    visibility.closeOnAutoclose();
    expect(floatingPlaylistOpen.value).toBe(true);
    playlistAutoClose.value = true;
    visibility.closeOnAutoclose();
    expect(floatingPlaylistOpen.value).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';

import { useFloatingPlaylistOpen } from './use-floating-playlist-open';

describe('useFloatingPlaylistOpen', () => {
  beforeEach(() => {
    useFloatingPlaylistOpen().closeFloatingPlaylist();
  });

  it('starts closed and shares open, toggle, and close controls', () => {
    const first = useFloatingPlaylistOpen();
    const second = useFloatingPlaylistOpen();

    expect(first.floatingPlaylistOpen.value).toBe(false);
    first.openFloatingPlaylist();
    expect(second.floatingPlaylistOpen.value).toBe(true);
    second.toggleFloatingPlaylist();
    expect(first.floatingPlaylistOpen.value).toBe(false);
    first.toggleFloatingPlaylist();
    expect(second.floatingPlaylistOpen.value).toBe(true);
    second.closeFloatingPlaylist();
    expect(first.floatingPlaylistOpen.value).toBe(false);
  });
});

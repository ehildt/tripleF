import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const toastWarning = vi.fn();

vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: () => ({
    show: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: toastWarning,
    error: vi.fn(),
    debug: vi.fn(),
    default: vi.fn(),
  }),
}));

import { usePlaylistStore } from '@/stores/playlist/playlist.store';

import { usePlaylistToggle } from './use-playlist-toggle';

const VIDEO = { videoUrl: 'https://video.test/one', title: 'One' };

describe('usePlaylistToggle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    toastWarning.mockClear();
  });

  function seedActivePlaylist() {
    const store = usePlaylistStore();
    store.playlists = [{ name: 'main', videos: [] }];
    store.activePlaylistName = 'main';
    return store;
  }

  it('reports not-added for a null item and toggling it does nothing', () => {
    const store = seedActivePlaylist();
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(() => null);
    expect(isInPlaylist.value).toBe(false);
    togglePlaylistVideo();
    expect(store.getActivePlaylist()?.videos).toEqual([]);
  });

  it('adds the video when an active playlist exists', () => {
    const store = seedActivePlaylist();
    const { togglePlaylistVideo } = usePlaylistToggle(ref(VIDEO));
    togglePlaylistVideo();
    expect(store.isVideoInActivePlaylist(VIDEO.videoUrl)).toBe(true);
  });

  it('warns and adds nothing when no active playlist exists', () => {
    const store = usePlaylistStore();
    const { togglePlaylistVideo } = usePlaylistToggle(ref(VIDEO));
    togglePlaylistVideo();
    expect(toastWarning).toHaveBeenCalledOnce();
    expect(store.getActivePlaylist()).toBeNull();
  });

  it('removes the video when it is already in the active playlist', () => {
    const store = seedActivePlaylist();
    store.addVideoToActivePlaylist(VIDEO);
    const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(ref(VIDEO));
    expect(isInPlaylist.value).toBe(true);
    togglePlaylistVideo();
    expect(store.isVideoInActivePlaylist(VIDEO.videoUrl)).toBe(false);
  });
});

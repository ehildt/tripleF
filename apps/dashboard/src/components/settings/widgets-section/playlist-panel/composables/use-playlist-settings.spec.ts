import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFloatingPlaylistOpen } from '@/components/widgets/floating-playlist/composables/use-floating-playlist-open';
import { usePlaylistSettingsStore } from '@/stores/widgets/playlist-settings/playlist-settings.store';

import { usePlaylistSettings } from './use-playlist-settings';

describe('usePlaylistSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    useFloatingPlaylistOpen().closeFloatingPlaylist();
  });

  it('opens the floating window when floating mode is enabled', () => {
    const settings = usePlaylistSettings();
    const floating = useFloatingPlaylistOpen();

    settings.setPlaylistMode('floating');

    expect(usePlaylistSettingsStore().playlistMode).toBe('floating');
    expect(floating.floatingPlaylistOpen.value).toBe(true);
    expect(localStorage.getItem('vision-playlist-mode')).toBe('floating');
  });

  it('changes back to panel mode without issuing window commands', () => {
    const floating = useFloatingPlaylistOpen();
    floating.openFloatingPlaylist();

    usePlaylistSettings().setPlaylistMode('panel');

    expect(usePlaylistSettingsStore().playlistMode).toBe('panel');
    expect(floating.floatingPlaylistOpen.value).toBe(true);
  });
});

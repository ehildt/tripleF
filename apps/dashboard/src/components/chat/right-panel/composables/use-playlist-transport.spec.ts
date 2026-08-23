import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import {
  dockPlayback,
  playbackDockMode,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/playback-anchor.state';
import {
  popoutHideOnPlaylist,
  setPopoutHideOnPlaylist,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import {
  closeLaunchedVideo,
  launchVideo,
} from '../../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { usePlaylistTransport } from './use-playlist-transport';

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

const playlist = { videos: [item], conversationId: 'conversation-1' };

describe('usePlaylistTransport popup visibility', () => {
  beforeEach(() => {
    localStorage.clear();
    setPopoutHideOnPlaylist(false);
    closeLaunchedVideo();
    playbackDockMode.value = 'auto';
  });

  it('the eye icon reads closed while the popout is dismissed', () => {
    const api = usePlaylistTransport(ref([]), ref('conversation-1'));
    expect(api.popoutHidden.value).toBe(false);
    // The popout's close dismisses the window while nothing is visible.
    dockPlayback();
    expect(api.popoutHidden.value).toBe(true);
  });

  it('clicking the closed eye shows the popout again', () => {
    const api = usePlaylistTransport(ref([]), ref('conversation-1'));
    dockPlayback();
    expect(api.popoutHidden.value).toBe(true);
    api.toggleHideOnPlaylist();
    expect(playbackDockMode.value).toBe('auto');
    expect(popoutHideOnPlaylist.value).toBe(false);
    expect(api.popoutHidden.value).toBe(false);
  });

  it('clicking the open eye enables the background-hide setting while nothing is launched', () => {
    const api = usePlaylistTransport(ref([]), ref('conversation-1'));
    expect(api.popoutHidden.value).toBe(false);
    api.toggleHideOnPlaylist();
    expect(popoutHideOnPlaylist.value).toBe(true);
  });

  it('clicking the open eye hides a standalone (figure-launched) window', () => {
    const api = usePlaylistTransport(ref([]), ref('conversation-1'));
    launchVideo(item);
    expect(api.popoutHidden.value).toBe(false);
    api.toggleHideOnPlaylist();
    expect(playbackDockMode.value).toBe('dock-dismissed');
    expect(api.popoutHidden.value).toBe(true);
    api.toggleHideOnPlaylist();
    expect(playbackDockMode.value).toBe('auto');
    expect(api.popoutHidden.value).toBe(false);
  });

  it('clicking the open eye hides a playlist-launched window via the setting', () => {
    const api = usePlaylistTransport(ref([]), ref('conversation-1'));
    launchVideo(item, playlist);
    api.toggleHideOnPlaylist();
    expect(popoutHideOnPlaylist.value).toBe(true);
    expect(api.popoutHidden.value).toBe(true);
    api.toggleHideOnPlaylist();
    expect(popoutHideOnPlaylist.value).toBe(false);
    expect(api.popoutHidden.value).toBe(false);
  });
});

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { usePlaylistTransport } from '@/components/chat/chat-right-toolbar/composables/use-playlist-transport';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { usePlaybackAnchorRegistry } from '@/composables/use-playback-anchor-registry/use-playback-anchor-registry';
import { usePlaybackSession } from '@/composables/use-playback-session/use-playback-session';

import { useFloatingPlayerHost } from './use-floating-player-host';

const PLAYLIST_VIDEO = {
  videoUrl: 'https://cdn.example.com/playlist-video.mp4',
  title: 'Playlist video',
};

describe('useFloatingPlayerHost', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();

    const registry = usePlaybackAnchorRegistry();
    registry.anchorCandidates.value = new Map();
    registry.playbackDockMode.value = 'auto';

    useConversationSession().setActiveConversationId(null);
    usePlaybackSession().stopPlayback();
    document.body.classList.remove('has-floating-video');
  });

  it('keeps a hidden playlist popout hidden and toggleable across conversation switches', async () => {
    const playback = usePlaybackSession();
    let host!: ReturnType<typeof useFloatingPlayerHost>;
    const wrapper = mount(
      defineComponent({
        setup() {
          host = useFloatingPlayerHost(playback);
          return () => h('div');
        },
      }),
    );
    const transport = usePlaylistTransport();
    const conversation = useConversationSession();

    playback.launchVideo(PLAYLIST_VIDEO, { videos: [PLAYLIST_VIDEO] });
    transport.toggleHideOnPlaylist();
    expect(host.windowHidden.value).toBe(true);

    conversation.setActiveConversationId('another-conversation');
    await nextTick();

    expect(host.windowHidden.value).toBe(true);
    expect(transport.popoutHidden.value).toBe(true);
    expect(host.launchedVideo.value).toEqual(PLAYLIST_VIDEO);

    transport.toggleHideOnPlaylist();
    expect(host.windowHidden.value).toBe(false);
    expect(transport.popoutHidden.value).toBe(false);

    transport.toggleHideOnPlaylist();
    expect(host.windowHidden.value).toBe(true);
    expect(transport.popoutHidden.value).toBe(true);

    wrapper.unmount();
  });
});

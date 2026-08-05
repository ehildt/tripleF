import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAllPlaylists } from '@/api/playlists.api';
import { closeLaunchedVideo } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { useConversationStore } from '@/stores/conversation';

import { activePlaylistName, playlists } from './composables/playlist.state';
import {
  floatingPlaylistOpen,
  playlistMode,
  resetPlaylistSettings,
} from './composables/playlist-settings.state';
import FloatingPlaylist from './FloatingPlaylist.vue';

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn(),
  fetchPlaylists: vi.fn(),
  savePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  renamePlaylist: vi.fn(),
}));

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

const otherItem = {
  videoUrl: 'https://youtu.be/other',
  title: 'Other video',
};

function mountWidget() {
  return mount(FloatingPlaylist);
}

describe('FloatingPlaylist', () => {
  beforeEach(async () => {
    localStorage.clear();
    closeLaunchedVideo();
    playlists.value = [];
    activePlaylistName.value = '';
    floatingPlaylistOpen.value = true;
    resetPlaylistSettings();
    setActivePinia(createPinia());
    useConversationStore().activeConversationId = 'conversation-1';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([]);
    // Flush any pending async playlist load from the previous test.
    await flushPromises();
  });

  it('renders nothing while the playlist mode is panel', () => {
    const wrapper = mountWidget();
    expect(wrapper.find('[data-floating-playlist-root]').exists()).toBe(false);
  });

  it('renders the open window in floating mode', () => {
    playlistMode.value = 'floating';
    const wrapper = mountWidget();
    expect(wrapper.find('.floating-playlist').exists()).toBe(true);
    expect(wrapper.find('.floating-playlist__assembly--closed').exists()).toBe(
      false,
    );
    // Open: the window is visible, no collapsed class.
    expect(wrapper.find('.floating-playlist__toggle').exists()).toBe(true);
  });

  it('collapses and shows the compact handle, reopens from it', async () => {
    playlistMode.value = 'floating';
    const wrapper = mountWidget();
    await wrapper.find('.floating-playlist__toggle').trigger('click');
    expect(wrapper.find('.floating-playlist__assembly--closed').exists()).toBe(
      true,
    );
    expect(floatingPlaylistOpen.value).toBe(false);
    const handle = wrapper.find('.floating-playlist__handle');
    expect(handle.exists()).toBe(true);
    await handle.trigger('click');
    expect(wrapper.find('.floating-playlist__assembly--closed').exists()).toBe(
      false,
    );
    expect(floatingPlaylistOpen.value).toBe(true);
  });

  it('lists the active playlist videos', async () => {
    playlistMode.value = 'floating';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
    ]);
    const wrapper = mountWidget();
    await flushPromises();
    expect(wrapper.find('.playlist-item').exists()).toBe(true);
    expect(wrapper.text()).toContain('Some video');
  });

  it('shows the empty state when there are no playlists', async () => {
    playlistMode.value = 'floating';
    const wrapper = mountWidget();
    await flushPromises();
    expect(wrapper.find('.playlist-item').exists()).toBe(false);
    // No playlist yet: only the create hint is shown, no message.
    expect(wrapper.text()).toContain('Create a playlist');
    expect(wrapper.text()).not.toContain('No videos in the playlist');
    expect(wrapper.text()).not.toContain('Add to playlist');
    expect(wrapper.text()).not.toContain('Remove from playlist');
  });

  it('shows the add/remove hints when a playlist exists but is empty', async () => {
    playlistMode.value = 'floating';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [] },
    ]);
    const wrapper = mountWidget();
    await flushPromises();
    expect(wrapper.find('.playlist-item').exists()).toBe(false);
    expect(wrapper.text()).toContain('No videos in the playlist');
    expect(wrapper.text()).toContain('Add to playlist');
    expect(wrapper.text()).toContain('Remove from playlist');
    expect(wrapper.text()).not.toContain('Create a playlist');
  });

  it('shows no playlist label while no playlist is active', async () => {
    playlistMode.value = 'floating';
    const wrapper = mountWidget();
    await flushPromises();
    expect(wrapper.find('.playlist-panel__active-name').exists()).toBe(false);
  });

  it('labels the active playlist with its name after picking one', async () => {
    playlistMode.value = 'floating';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [otherItem] },
    ]);
    const wrapper = mountWidget();
    await flushPromises();
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    await wrapper.find('.playlist-menu-item__input').trigger('click');
    expect(wrapper.find('.playlist-panel__active-name').text()).toBe('Focus');
  });

  it('opens the playlists menu with the name input as first field', async () => {
    playlistMode.value = 'floating';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [item] },
    ]);
    const wrapper = mountWidget();
    await flushPromises();
    expect(wrapper.find('.playlist-menu__input').exists()).toBe(false);
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    expect(wrapper.find('.playlist-menu__input').exists()).toBe(true);
    const itemInput = wrapper.find('.playlist-menu-item__input');
    expect(itemInput.exists()).toBe(true);
    expect((itemInput.element as HTMLInputElement).value).toBe('Focus');
  });

  it('picking a playlist in the menu loads its videos', async () => {
    playlistMode.value = 'floating';
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conversation-1', videos: [otherItem] },
    ]);
    const wrapper = mountWidget();
    await flushPromises();
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    await wrapper.find('.playlist-menu-item__input').trigger('click');
    expect(wrapper.text()).toContain('Other video');
  });
});

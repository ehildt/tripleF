import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  addPlaylistVideo,
  closeLaunchedVideo,
  FLOATING_PLAYLIST_QUEUE_KEY,
  isPlaylistVideo,
  removePlaylistVideo,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { useConversationStore } from '@/stores/conversation';

import {
  floatingPlaylistOpen,
  playlistMode,
  resetPlaylistSettings,
} from './composables/playlist-settings.state';
import {
  activeSavedPlaylistId,
  savedPlaylists,
} from './composables/saved-playlists.state';
import FloatingPlaylist from './FloatingPlaylist.vue';

const item = {
  videoUrl: 'https://www.youtube.com/watch?v=abc',
  title: 'Some video',
};

function mountWidget() {
  return mount(FloatingPlaylist);
}

describe('FloatingPlaylist', () => {
  beforeEach(() => {
    localStorage.clear();
    closeLaunchedVideo();
    removePlaylistVideo('conversation-1', item.videoUrl);
    removePlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl);
    savedPlaylists.value = [];
    activeSavedPlaylistId.value = null;
    floatingPlaylistOpen.value = true;
    resetPlaylistSettings();
    setActivePinia(createPinia());
    useConversationStore().activeConversationId = 'conversation-1';
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

  it('lists the queued videos regardless of the active conversation', () => {
    playlistMode.value = 'floating';
    addPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item);
    const wrapper = mountWidget();
    expect(wrapper.find('.playlist-item').exists()).toBe(true);
    expect(wrapper.text()).toContain('Some video');
  });

  it('the floating queue survives a conversation switch', () => {
    playlistMode.value = 'floating';
    addPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item);
    const wrapper = mountWidget();
    useConversationStore().activeConversationId = 'another-conversation';
    expect(wrapper.find('.playlist-item').exists()).toBe(true);
    expect(wrapper.text()).toContain('Some video');
  });

  it('shows the empty state when the queue is empty', () => {
    playlistMode.value = 'floating';
    const wrapper = mountWidget();
    expect(wrapper.find('.playlist-item').exists()).toBe(false);
    expect(wrapper.text()).toContain('No videos in the playlist');
  });

  it('shows no playlist label while the queue is unnamed', () => {
    playlistMode.value = 'floating';
    const wrapper = mountWidget();
    expect(wrapper.find('.floating-playlist__active-name').exists()).toBe(
      false,
    );
  });

  it('labels the active playlist with its name after picking a saved one', async () => {
    playlistMode.value = 'floating';
    savedPlaylists.value = [
      {
        id: 'p1',
        name: 'Focus',
        videos: [{ videoUrl: 'https://youtu.be/other', title: 'Other video' }],
      },
    ];
    const wrapper = mountWidget();
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    await wrapper.find('.playlist-menu-item__input').trigger('click');
    expect(wrapper.find('.floating-playlist__active-name').text()).toBe(
      'Focus',
    );
  });

  it('opens the saved-playlists menu with the name input as first field', async () => {
    playlistMode.value = 'floating';
    addPlaylistVideo('conversation-1', item);
    savedPlaylists.value = [{ id: 'p1', name: 'Focus', videos: [item] }];
    const wrapper = mountWidget();
    // No list dropdown row and no load button anymore.
    expect(wrapper.find('.input-select__button').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Load selected playlist"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('.playlist-menu__input').exists()).toBe(false);
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    expect(wrapper.find('.playlist-menu__input').exists()).toBe(true);
    const itemInput = wrapper.find('.playlist-menu-item__input');
    expect(itemInput.exists()).toBe(true);
    expect((itemInput.element as HTMLInputElement).value).toBe('Focus');
  });

  it('picking a playlist in the menu autoloads it without a load button', async () => {
    playlistMode.value = 'floating';
    savedPlaylists.value = [
      {
        id: 'p1',
        name: 'Focus',
        videos: [{ videoUrl: 'https://youtu.be/other', title: 'Other video' }],
      },
    ];
    addPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item);
    const wrapper = mountWidget();
    await wrapper.find('.playlist-menu__trigger').trigger('click');
    await wrapper.find('.playlist-menu-item__input').trigger('click');
    expect(isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, item.videoUrl)).toBe(
      false,
    );
    expect(
      isPlaylistVideo(FLOATING_PLAYLIST_QUEUE_KEY, 'https://youtu.be/other'),
    ).toBe(true);
    expect(wrapper.text()).toContain('Other video');
  });
});

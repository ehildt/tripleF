import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAllPlaylists } from '@/api/playlists.api';
import { useConversationStore } from '@/stores/conversation';
import type { Conversation } from '@/stores/conversation.model';

import {
  activePlaylistName,
  playlists,
  setPlaylists,
} from '../../widgets/floating-playlist/composables/playlist.state';
import {
  clearActivePlayback,
  closeLaunchedVideo,
  setActivePlayback,
} from '../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import ChatRightPanel from './ChatRightPanel.vue';

vi.mock('@/api/playlists.api', () => ({
  fetchAllPlaylists: vi.fn(),
  fetchPlaylists: vi.fn(),
  savePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  renamePlaylist: vi.fn(),
}));

beforeEach(async () => {
  localStorage.clear();
  closeLaunchedVideo();
  clearActivePlayback();
  playlists.value = [];
  activePlaylistName.value = '';
  setActivePinia(createPinia());
  useConversationStore().activeConversationId = 'conv-1';
  vi.mocked(fetchAllPlaylists).mockResolvedValue([]);
  // Flush any pending async playlist load from the previous test.
  await flushPromises();
});

const placeholderImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function makeConversation(): Conversation {
  return {
    id: 'conv-1',
    title: 'Test conversation',
    exchanges: [],
    files: [],
    savedFileInfos: [],
    uploadedImages: [],
    imageSelectionSnapshot: {},
    conversationId: 'conv-1',
    model: 'llama3',
    numCtx: '2048',
    think: 'medium',
    event: 'harness',
    roomId: 'conv-1',
    stream: false,
    subscriptions: [],
    type: 'temporary',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function mountComponent(props = {}) {
  return mount(ChatRightPanel, {
    props: {
      conversation: makeConversation(),
      conversationId: 'conv-1',
      attachments: [],
      messageListItems: [],
      playlistVideos: [],
      rightPanelView: 'files',
      ...props,
    },
  });
}

describe('ChatRightPanel', () => {
  it('renders file cards when files exist', () => {
    const wrapper = mountComponent({
      attachments: [
        {
          id: 'pending-1',
          name: 'cat.png',
          hash: 'h1',
          previewUrl: placeholderImage,
          isUploaded: false,
          isSelected: true,
          pendingIndex: 0,
        },
      ],
      rightPanelView: 'files',
    });

    expect(wrapper.findAll('.attachment-card')).toHaveLength(1);
  });

  it('renders prompt list when view is history', () => {
    const wrapper = mountComponent({
      messageListItems: [{ role: 'user', content: 'hi' }],
      rightPanelView: 'history',
    });

    expect(wrapper.find('.expandable-message-list').exists()).toBe(true);
  });

  it('emits removeAttachment when the remove button is clicked', async () => {
    const wrapper = mountComponent({
      attachments: [
        {
          id: 'pending-1',
          name: 'cat.png',
          hash: 'h1',
          previewUrl: placeholderImage,
          isUploaded: false,
          isSelected: true,
          pendingIndex: 0,
        },
      ],
      rightPanelView: 'files',
    });

    await wrapper.find('.attachment-card__remove').trigger('click');

    expect(wrapper.emitted('removeAttachment')).toEqual([['pending-1']]);
  });

  it('emits toggleAttachment when the file thumbnail is clicked', async () => {
    const wrapper = mountComponent({
      attachments: [
        {
          id: 'pending-1',
          name: 'cat.png',
          hash: 'h1',
          previewUrl: placeholderImage,
          isUploaded: false,
          isSelected: true,
          pendingIndex: 0,
        },
      ],
      rightPanelView: 'files',
    });

    await wrapper.find('.attachment-card__thumb').trigger('click');

    expect(wrapper.emitted('toggleAttachment')).toEqual([['pending-1']]);
  });

  it('emits selectView when the history tab is clicked', async () => {
    const wrapper = mountComponent({
      messageListItems: [{ role: 'user', content: 'hi' }],
      rightPanelView: 'files',
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('selectView')).toEqual([['history']]);
  });

  it('marks unselected files with a dimmed modifier class', () => {
    const wrapper = mountComponent({
      attachments: [
        {
          id: 'pending-1',
          name: 'cat.png',
          hash: 'h1',
          previewUrl: placeholderImage,
          isUploaded: false,
          isSelected: false,
          pendingIndex: 0,
        },
      ],
      rightPanelView: 'files',
    });

    expect(wrapper.find('.attachment-card--unselected').exists()).toBe(true);
  });

  it('shows cloud indicator for uploaded items', () => {
    const wrapper = mountComponent({
      attachments: [
        {
          id: 'uploaded-h1',
          name: 'cat.png',
          hash: 'h1',
          previewUrl: '',
          isUploaded: true,
          isSelected: true,
          pendingIndex: null,
        },
      ],
      rightPanelView: 'files',
    });

    expect(wrapper.find('.attachment-card__uploaded-indicator').exists()).toBe(
      true,
    );
  });

  it.each([
    ['https://youtu.be/in-list', 'In List', 'In List'],
    ['https://youtu.be/in-list', 'Raw engagement title', 'In List'],
  ])(
    'shows the now-playing title on the active item row for playback %s',
    async (url, playbackTitle, expected) => {
      vi.mocked(fetchAllPlaylists).mockResolvedValue([
        {
          name: 'Focus',
          conversationId: 'conv-1',
          videos: [{ videoUrl: 'https://youtu.be/in-list', title: 'In List' }],
        },
      ]);
      const wrapper = mountComponent({
        playlistVideos: [
          { videoUrl: 'https://youtu.be/in-list', title: 'In List' },
        ],
        rightPanelView: 'playlist',
      });
      await flushPromises();
      setActivePlayback(url, playbackTitle);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.playlist-item__marquee-text').text()).toBe(
        expected,
      );
    },
  );

  it('shows no separate now-playing marquee in the transport bar (matches the floating player)', async () => {
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      {
        name: 'Focus',
        conversationId: 'conv-1',
        videos: [{ videoUrl: 'https://youtu.be/in-list', title: 'In List' }],
      },
    ]);
    const wrapper = mountComponent({
      playlistVideos: [
        { videoUrl: 'https://youtu.be/in-list', title: 'In List' },
      ],
      rightPanelView: 'playlist',
    });
    await flushPromises();
    setActivePlayback('https://youtu.be/outside', 'Outside Title');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.playlist-transport-bar__now-playing').exists()).toBe(
      false,
    );
  });

  it('shows the player with an empty queue when a playlist exists', async () => {
    setPlaylists([{ name: 'Focus', videos: [], conversationId: 'conv-1' }]);
    vi.mocked(fetchAllPlaylists).mockResolvedValue([
      { name: 'Focus', conversationId: 'conv-1', videos: [] },
    ]);
    const wrapper = mountComponent({
      playlistVideos: [],
      rightPanelView: 'playlist',
    });
    await flushPromises();
    expect(wrapper.find('.playlist-panel').exists()).toBe(true);
  });
});

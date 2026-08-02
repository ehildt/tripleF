import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Conversation } from '@/stores/conversation.model';

import {
  clearActivePlayback,
  closeLaunchedVideo,
  setActivePlayback,
} from '../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import ChatRightPanel from './ChatRightPanel.vue';

beforeEach(() => {
  localStorage.clear();
  closeLaunchedVideo();
  clearActivePlayback();
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

    expect(wrapper.findAll('.attachment-card').length).toBe(1);
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

  it('shows the playlist entry title in the now-playing marquee', async () => {
    const wrapper = mountComponent({
      playlistVideos: [
        { videoUrl: 'https://youtu.be/in-list', title: 'In List' },
      ],
      rightPanelView: 'playlist',
    });
    setActivePlayback('https://youtu.be/in-list', 'In List');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.playlist-transport-bar__now-playing-text').text(),
    ).toBe('In List');
  });

  it('shows an outside video title in the now-playing marquee', async () => {
    const wrapper = mountComponent({
      playlistVideos: [
        { videoUrl: 'https://youtu.be/in-list', title: 'In List' },
      ],
      rightPanelView: 'playlist',
    });
    // A video that was never added to the playlist starts playing elsewhere.
    setActivePlayback('https://youtu.be/outside', 'Outside Title');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.playlist-transport-bar__now-playing-text').text(),
    ).toBe('Outside Title');
  });

  it('prefers the playlist metadata over the engagement title', async () => {
    const wrapper = mountComponent({
      playlistVideos: [
        { videoUrl: 'https://youtu.be/in-list', title: 'In List' },
      ],
      rightPanelView: 'playlist',
    });
    setActivePlayback('https://youtu.be/in-list', 'Raw engagement title');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.playlist-transport-bar__now-playing-text').text(),
    ).toBe('In List');
  });
});

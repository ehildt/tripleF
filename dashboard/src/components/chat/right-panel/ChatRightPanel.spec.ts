import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ChatRightPanel from './ChatRightPanel.vue';

const placeholderImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function mountComponent(props = {}) {
  return mount(ChatRightPanel, {
    props: {
      attachments: [],
      messageListItems: [],
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

    expect(wrapper.findAll('.chat-right-panel__file-card').length).toBe(1);
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

    await wrapper.find('.chat-right-panel__file-remove').trigger('click');

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

    await wrapper.find('.chat-right-panel__file-thumb').trigger('click');

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

    expect(
      wrapper.find('.chat-right-panel__file-card--unselected').exists(),
    ).toBe(true);
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

    expect(wrapper.find('.chat-right-panel__uploaded-indicator').exists()).toBe(
      true,
    );
  });
});

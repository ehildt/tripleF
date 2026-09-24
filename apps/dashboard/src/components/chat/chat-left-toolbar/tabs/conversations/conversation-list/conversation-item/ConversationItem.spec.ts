import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';

import { createConversation } from '@/stores/helpers/conversation/create-conversation.helper';

import ConversationItem from './ConversationItem.vue';

function makeConversation(
  overrides: Partial<ReturnType<typeof createConversation>> = {},
) {
  return {
    ...createConversation({ type: 'temporary' }),
    ...overrides,
  };
}

function mountItem(conversation: ReturnType<typeof makeConversation>) {
  return mount(ConversationItem as Component, {
    props: {
      conversation,
      isActive: false,
      contextUsagePercent: null,
    } as any,
  });
}

describe('ConversationItem', () => {
  it('shows a Clock icon for a temporary conversation', () => {
    const wrapper = mountItem(makeConversation());
    expect(wrapper.find('[aria-label="Pin to persistent"]').exists()).toBe(
      true,
    );
  });

  it('shows a Pin icon for a persistent conversation', () => {
    const wrapper = mountItem(makeConversation({ type: 'persistent' }));
    expect(wrapper.find('[aria-label="Unpin to temporary"]').exists()).toBe(
      true,
    );
  });

  it('emits toggle-type when the pin button is clicked', async () => {
    const wrapper = mountItem(makeConversation());
    await wrapper.find('[aria-label="Pin to persistent"]').trigger('click');
    expect(wrapper.emitted('toggleType')).toBeTruthy();
  });

  it('emits delete when the delete button is clicked', async () => {
    const wrapper = mountItem(makeConversation());
    await wrapper.find('[aria-label="Delete"]').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});

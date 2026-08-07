import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import ChatConversationHeader from './ChatConversationHeader.vue';

vi.mock('../../../api/storage.api', () => ({
  deleteUploadedObject: vi.fn().mockResolvedValue(undefined),
}));

let activePinia: ReturnType<typeof createPinia>;

describe('ChatConversationHeader', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
    localStorage.clear();
  });

  function mountComponent(props: { conversationId: string; title?: string }) {
    return mount(
      ChatConversationHeader as Component,
      {
        props: { title: 'Test Conversation', ...props },
        global: { plugins: [activePinia] },
      } as any,
    );
  }

  it('renders the conversation title', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation('temporary');

    const wrapper = mountComponent({
      conversationId: conversation.id,
      title: 'My Conversation',
    });

    expect(wrapper.text()).toContain('My Conversation');
  });

  it('emits delete when the trash icon is clicked', async () => {
    const activePinia = createPinia();
    setActivePinia(activePinia);
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation('temporary');

    const wrapper = mount(
      ChatConversationHeader as Component,
      {
        props: { conversationId: conversation.id, title: 'To Delete' },
        global: { plugins: [activePinia] },
      } as any,
    );

    const trashButton = wrapper.find('[aria-label="Delete conversation"]');
    expect(trashButton.exists()).toBe(true);

    await trashButton.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual([conversation.id]);
  });
});

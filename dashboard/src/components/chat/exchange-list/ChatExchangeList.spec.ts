import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import ChatConversationHeader from '../conversation-header/ChatConversationHeader.vue';
import ChatExchangeList from './ChatExchangeList.vue';

let activePinia: ReturnType<typeof createPinia>;
const mockRetryHandler = vi.fn();

function mountComponent(props?: Record<string, unknown>) {
  return mount(
    ChatExchangeList as Component,
    {
      props: { retryHandler: mockRetryHandler, ...props },
      global: { plugins: [activePinia] },
    } as any,
  );
}

describe('ChatExchangeList', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
  });

  it('renders the no-conversation panel when no conversation is active', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('No conversation selected');
  });

  it('hides the conversation header when no conversation is active', () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent(ChatConversationHeader).exists()).toBe(false);
  });

  it('renders the conversation header with the conversation title when active', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const wrapper = mountComponent();
    const header = wrapper.findComponent(ChatConversationHeader);

    expect(header.exists()).toBe(true);
    expect(header.props('title')).toBe(conversation.title);
  });

  it('renders the empty-state hint when an active conversation has no exchanges', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const wrapper = mountComponent();
    expect(wrapper.text()).toContain(
      'Send a message to start the conversation.',
    );
  });

  it('renders exchanges from the active conversation', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: 'Hello',
      status: 'done',
    });
    conversationStore.addExchange(conversation.id, {
      role: 'assistant',
      content: 'Hi there',
      status: 'done',
    });
    conversationStore.setActiveConversation(conversation.id);

    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Hello');
    expect(wrapper.text()).toContain('Hi there');
  });

  it('exposes scrollToExchange that scrolls the target into view', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: 'Hello',
      status: 'done',
    });
    conversationStore.setActiveConversation(conversation.id);
    const targetId = conversation.exchanges[0]?.id;

    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();

    expect(targetId).toBeTruthy();

    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    (
      wrapper.vm as unknown as {
        scrollToExchange: (id: string) => void;
      }
    ).scrollToExchange(targetId!);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'nearest',
    });
  });
});

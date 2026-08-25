import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import { useAppStore } from '@/stores/app';
import { useConversationStore } from '@/stores/conversation';

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
  beforeEach(async () => {
    activePinia = createPinia();
    setActivePinia(activePinia);
    // Settle the store's async boot (stub-list fetch) so `hydrated` flips
    // true and the loading skeleton doesn't cover the content under test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('renders the no-conversation panel when no conversation is active', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.exchange-skeleton').exists()).toBe(false);
    expect(wrapper.text()).toContain('No chat selected');
  });

  it('shows the loading skeleton while the conversation list is still booting', () => {
    // A fresh, un-settled store: the list fetch has not resolved yet.
    activePinia = createPinia();
    setActivePinia(activePinia);
    const wrapper = mountComponent();
    expect(wrapper.find('.exchange-skeleton').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('No chat selected');
  });

  it('shows the loading skeleton while the active conversation hydrates', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    // Simulate a server stub that is still waiting for its full content.
    conversation.loaded = false;
    conversationStore.setActiveConversation(conversation.id);

    const wrapper = mountComponent();
    expect(wrapper.find('.exchange-skeleton').exists()).toBe(true);
  });

  it('renders the empty-state hint when an active conversation has no exchanges', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const wrapper = mountComponent();
    expect(wrapper.find('.exchange-skeleton').exists()).toBe(false);
    expect(wrapper.text()).toContain('Say something to get this chat going');
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
    expect(wrapper.find('.exchange-skeleton').exists()).toBe(false);
    expect(wrapper.text()).toContain('Hello');
    expect(wrapper.text()).toContain('Hi there');
  });

  it('exposes scrollToExchange that scrolls the target section into view', async () => {
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
    const targetId = conversation.exchanges[0]?.id;

    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();

    expect(targetId).toBeTruthy();

    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;

    (
      wrapper.vm as unknown as {
        scrollToExchange: (id: string) => void;
      }
    ).scrollToExchange(targetId!);

    expect(scrollTo).toHaveBeenCalled();
  });

  it('remounts the scroll list when the active conversation changes', async () => {
    const conversationStore = useConversationStore();
    const first = conversationStore.ensureConversation();
    const second = conversationStore.createNewConversation();
    conversationStore.setActiveConversation(first.id);

    const wrapper = mountComponent();
    const listBefore = wrapper.find('[data-playback-scroll-root]').element;

    // A cached conversation hydrates without a skeleton pass, so without a
    // remount the scroll container keeps the previous chat's scroll state
    // (offset, saved positions, blend opacity inputs).
    conversationStore.setActiveConversation(second.id);
    await wrapper.vm.$nextTick();

    const listAfter = wrapper.find('[data-playback-scroll-root]').element;
    expect(listAfter).not.toBe(listBefore);
  });

  it('does not carry the old chat reading position into a chat with a different scroll mode', async () => {
    const conversationStore = useConversationStore();
    const appStore = useAppStore();
    const nativeChat = conversationStore.ensureConversation();
    conversationStore.addExchange(nativeChat.id, {
      role: 'user',
      content: 'Native chat',
      status: 'done',
    });
    const carouselChat = conversationStore.createNewConversation();
    conversationStore.addExchange(carouselChat.id, {
      role: 'user',
      content: 'Carousel chat',
      status: 'done',
    });
    appStore.setConversationScrollMode(nativeChat.id, 'native');
    conversationStore.setActiveConversation(nativeChat.id);

    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();

    const scrollTo = vi.fn();
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = scrollTo;

    // Switching to the carousel-mode chat must not run the mode-switch
    // restore: the reading position belongs to the old chat, and applying it
    // smooth-scrolls the new chat to an arbitrary section, crossfading every
    // slide along the way. Only the new chat's own mount-time auto-scroll
    // (a no-op in jsdom's zero-height DOM) may run.
    conversationStore.setActiveConversation(carouselChat.id);
    await new Promise((resolve) => setTimeout(resolve, 10));
    HTMLElement.prototype.scrollTo = originalScrollTo;

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

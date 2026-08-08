import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import { useAppStore } from '@/stores/app';

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
    const wrapper = mountComponent({
      conversationId: 'conv-1',
      title: 'My Conversation',
    });

    expect(wrapper.text()).toContain('My Conversation');
  });

  it('toggles the conversation media priority between images and videos', async () => {
    const appStore = useAppStore();

    const wrapper = mountComponent({ conversationId: 'conv-1' });

    expect(appStore.getConversationMediaPriority('conv-1')).toBe('images');

    const imagesButton = wrapper.find('[aria-label="Prioritize images"]');
    expect(imagesButton.exists()).toBe(true);

    await imagesButton.trigger('click');

    expect(appStore.getConversationMediaPriority('conv-1')).toBe('videos');
    expect(wrapper.find('[aria-label="Prioritize videos"]').exists()).toBe(
      true,
    );
  });

  it('toggles the conversation scroll mode between carousel and native', async () => {
    const appStore = useAppStore();

    const wrapper = mountComponent({ conversationId: 'conv-1' });

    expect(appStore.getConversationScrollMode('conv-1')).toBe('carousel');

    const carouselButton = wrapper.find('[aria-label="Carousel scroll"]');
    expect(carouselButton.exists()).toBe(true);

    await carouselButton.trigger('click');

    expect(appStore.getConversationScrollMode('conv-1')).toBe('native');
  });
});

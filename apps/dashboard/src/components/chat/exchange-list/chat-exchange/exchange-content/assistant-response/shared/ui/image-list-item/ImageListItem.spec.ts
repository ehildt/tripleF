import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import AddToFilesButton from '../add-to-files-button/AddToFilesButton.vue';
import ImageListItem from './ImageListItem.vue';

// The conversation store hydrates persisted conversations asynchronously on
// creation; mock the API so the boot settle is deterministic and fast.
vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

let activePinia: ReturnType<typeof createPinia>;

function mountItem(item: {
  imageUrl: string;
  imageAlt?: string;
  source?: string;
}) {
  const onImageClicked = vi.fn();
  return {
    wrapper: mount(ImageListItem, {
      props: { item },
      global: {
        plugins: [activePinia],
        provide: {
          [harnessImageClickedKey as symbol]: onImageClicked,
        },
      },
    }),
    onImageClicked,
  };
}

describe('ImageListItem', () => {
  beforeEach(async () => {
    activePinia = createPinia();
    setActivePinia(activePinia);
    localStorage.clear();
    vi.clearAllMocks();
    // Settle the store's boot hydration before seeding a conversation, or
    // the async load result would wipe conversations created mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('shows the skeleton until the image fires its load event', async () => {
    const { wrapper } = mountItem({ imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);
    expect(wrapper.find('img').classes()).not.toContain(
      'async-image__img--loaded',
    );

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('hides the skeleton and marks the tile as failed on image error', async () => {
    const { wrapper } = mountItem({ imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--error');
    expect(wrapper.find('button').classes()).toContain(
      'image-item__trigger--error',
    );
  });

  it('does not emit the click once the image failed to load', async () => {
    const { wrapper, onImageClicked } = mountItem({ imageUrl: '/missing.png' });
    await wrapper.find('img').trigger('error');

    await wrapper.find('button').trigger('click');

    expect(onImageClicked).not.toHaveBeenCalled();
  });

  it('emits the clicked item through the injected handler', async () => {
    const item = { imageUrl: '/a', imageAlt: 'a' };
    const { wrapper, onImageClicked } = mountItem(item);
    await wrapper.find('img').trigger('load');

    await wrapper.find('button').trigger('click');

    expect(onImageClicked).toHaveBeenCalledWith(item);
  });

  it('shows the add-to-files button only for cloud storage images', () => {
    const cloud = mountItem({
      imageUrl: '/api/v1/storage/session-1/conversation-1/hash-1',
      imageAlt: 'Cloud photo',
      source: 'cloud',
    });

    const local = mountItem({ imageUrl: '/a.png', source: 'local' });

    expect(cloud.wrapper.findComponent(AddToFilesButton).exists()).toBe(true);
    expect(local.wrapper.findComponent(AddToFilesButton).exists()).toBe(false);
  });

  it('toggles the image as a conversation file', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const { wrapper } = mountItem({
      imageUrl: '/api/v1/storage/session-1/conversation-1/hash-1',
      imageAlt: 'Cloud photo',
      source: 'cloud',
    });

    const button = wrapper.find('button[aria-label="Add to files"]');
    await button.trigger('click');

    const images = conversationStore.getUploadedImagesForConversation(
      conversation.id,
    );
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({
      name: 'Cloud photo',
      hash: 'hash-1',
      selected: true,
      source: 'cloud',
    });

    // The button flips to the remove state once the image is in files.
    expect(
      wrapper.find('button[aria-label="Remove from files"]').exists(),
    ).toBe(true);

    await wrapper
      .find('button[aria-label="Remove from files"]')
      .trigger('click');
    expect(
      conversationStore.getUploadedImagesForConversation(conversation.id),
    ).toHaveLength(0);
  });
});

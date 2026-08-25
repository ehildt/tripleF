import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import AddToFilesButton from '../../add-to-files-button/AddToFilesButton.vue';
import GalleryItem from './GalleryItem.vue';

// The conversation store hydrates persisted conversations asynchronously on
// creation; mock the API so the boot settle is deterministic and fast.
vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

let activePinia: ReturnType<typeof createPinia>;

function mountGalleryItem(item: {
  imageUrl: string;
  imageAlt?: string;
  source?: string;
}) {
  const onImageClicked = vi.fn();
  return {
    wrapper: mount(GalleryItem, {
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

describe('GalleryItem', () => {
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
    const { wrapper } = mountGalleryItem({ imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);
    expect(wrapper.find('img').classes()).not.toContain(
      'async-image__img--loaded',
    );

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('replaces the skeleton with the error state on image failure', async () => {
    const { wrapper } = mountGalleryItem({ imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--error');
    expect(wrapper.find('button').classes()).toContain(
      'harness-gallery__trigger--error',
    );
  });

  it('renders an image with an encoded source', () => {
    const { wrapper } = mountGalleryItem({
      imageUrl: '/api/v1/storage/req-1/0?foo=bar baz',
      imageAlt: 'photo',
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(
      encodeURI('/api/v1/storage/req-1/0?foo=bar baz'),
    );
  });

  it('emits the clicked item through the injected handler', async () => {
    const item = { imageUrl: '/a', imageAlt: 'a' };
    const { wrapper, onImageClicked } = mountGalleryItem(item);

    await wrapper.find('button').trigger('click');

    expect(onImageClicked).toHaveBeenCalledWith(item);
  });

  it('does not render when there is no imageUrl', () => {
    const { wrapper } = mountGalleryItem({ imageUrl: '' });

    expect(wrapper.find('li').exists()).toBe(false);
  });

  it('shows the add-to-files button only for cloud storage images', () => {
    const cloud = mountGalleryItem({
      imageUrl: '/api/v1/storage/session-1/conversation-1/hash-1',
      imageAlt: 'Cloud photo',
      source: 'cloud',
    });

    const local = mountGalleryItem({ imageUrl: '/a.png', source: 'local' });

    expect(cloud.wrapper.findComponent(AddToFilesButton).exists()).toBe(true);
    expect(local.wrapper.findComponent(AddToFilesButton).exists()).toBe(false);
  });

  it('toggles the image as a conversation file', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);

    const { wrapper } = mountGalleryItem({
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

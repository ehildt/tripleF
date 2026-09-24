import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import type { AddableImage } from './use-add-image-to-files.composable';
import { useAddImageToFiles } from './use-add-image-to-files.composable';

const CLOUD_ITEM: AddableImage = {
  imageUrl: '/api/v1/storage/session-1/conversation-1/hash-a',
  imageAlt: 'A cloud photo',
  title: 'A cloud photo',
  source: 'cloud',
};

describe('useAddImageToFiles', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function setupActiveConversation() {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    return conversationStore;
  }

  it('reports cloud storage images as addable and not yet in files', () => {
    setupActiveConversation();
    const { canAddToFiles, isInFiles } = useAddImageToFiles(() => CLOUD_ITEM);
    expect(canAddToFiles.value).toBe(true);
    expect(isInFiles.value).toBe(false);
  });

  it('rejects local images, external urls, and null items', () => {
    setupActiveConversation();
    const local = useAddImageToFiles(() => ({
      ...CLOUD_ITEM,
      source: 'local',
    }));
    const external = useAddImageToFiles(() => ({
      imageUrl: 'https://cdn.example.com/img.png',
      source: 'cloud',
    }));
    const missing = useAddImageToFiles(() => null);

    expect(local.canAddToFiles.value).toBe(false);
    expect(local.isInFiles.value).toBe(false);
    expect(external.canAddToFiles.value).toBe(false);
    expect(missing.canAddToFiles.value).toBe(false);
    expect(missing.isInFiles.value).toBe(false);
  });

  it('registers the image as a selected cloud file on toggle', () => {
    const conversationStore = setupActiveConversation();
    const { isInFiles, toggleAddToFiles } = useAddImageToFiles(
      () => CLOUD_ITEM,
    );

    toggleAddToFiles();

    const images = conversationStore.getUploadedImagesForConversation(
      conversationStore.activeConversationId ?? '',
    );
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({
      name: 'A cloud photo',
      hash: 'hash-a',
      selected: true,
      source: 'cloud',
    });
    expect(isInFiles.value).toBe(true);
  });

  it('removes the file reference when toggled while added', () => {
    const conversationStore = setupActiveConversation();
    const { isInFiles, toggleAddToFiles } = useAddImageToFiles(
      () => CLOUD_ITEM,
    );

    toggleAddToFiles();
    toggleAddToFiles();

    expect(isInFiles.value).toBe(false);
    expect(
      conversationStore.getUploadedImagesForConversation(
        conversationStore.activeConversationId ?? '',
      ),
    ).toHaveLength(0);
  });

  it('falls back to the hash as the file name when the item has no title', () => {
    const conversationStore = setupActiveConversation();
    const { toggleAddToFiles } = useAddImageToFiles(() => ({
      imageUrl: CLOUD_ITEM.imageUrl,
      source: 'cloud',
    }));

    toggleAddToFiles();

    const images = conversationStore.getUploadedImagesForConversation(
      conversationStore.activeConversationId ?? '',
    );
    expect(images[0]?.name).toBe('hash-a');
  });

  it('toggles nothing when no conversation is active', () => {
    const conversationStore = useConversationStore();
    const { canAddToFiles, isInFiles, toggleAddToFiles } = useAddImageToFiles(
      () => CLOUD_ITEM,
    );

    toggleAddToFiles();

    expect(canAddToFiles.value).toBe(true);
    expect(isInFiles.value).toBe(false);
    expect(conversationStore.conversations).toHaveLength(0);
  });

  it('follows a reactive item that becomes addable later', () => {
    setupActiveConversation();
    const item = ref<AddableImage | null>(null);
    const { canAddToFiles, toggleAddToFiles } = useAddImageToFiles(item);

    expect(canAddToFiles.value).toBe(false);
    item.value = CLOUD_ITEM;
    expect(canAddToFiles.value).toBe(true);

    toggleAddToFiles();
    const conversationStore = useConversationStore();
    expect(
      conversationStore.getUploadedImagesForConversation(
        conversationStore.activeConversationId ?? '',
      ),
    ).toHaveLength(1);
  });
});

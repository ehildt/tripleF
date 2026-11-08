import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { getUploadedImagesForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-images-for-conversation.helper';

import { useConversationImages } from './use-conversation-images';

const catalog = vi.hoisted(() => ({ loadConversationForWrite: vi.fn() }));
const persistence = vi.hoisted(() => ({
  persistConversation: vi.fn(async () => {}),
}));

vi.mock('./use-conversation-catalog', () => ({
  useConversationCatalog: () => catalog,
}));
vi.mock('./use-conversation-persistence', () => ({
  useConversationPersistence: () => persistence,
}));

function seed() {
  const conversation = createConversation('New chat', {
    conversationId: 'server-1',
  });
  useConversationStore().insertConversation(conversation, true);
  return conversation;
}

function image(hash: string, conversationId: string, parentHash?: string) {
  return {
    name: `${hash}.png`,
    hash,
    uploadedAt: 1,
    selected: true,
    conversationId,
    ...(parentHash ? { parentHash } : {}),
  };
}

describe('useConversationImages', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    persistence.persistConversation.mockResolvedValue(undefined);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) =>
      useConversationStore().getConversation(id),
    );
  });

  it('merges and scopes uploaded images', async () => {
    const conversation = seed();

    await useConversationImages().setUploadedImages(conversation.id, [
      image('current', conversation.conversationId),
      image('other', 'other-context'),
    ]);

    expect(
      getUploadedImagesForConversation(
        conversation,
        conversation.conversationId,
      ),
    ).toHaveLength(1);
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
  });

  it('toggles, snapshots, restores, and clears image selections', async () => {
    const conversation = seed();
    const images = useConversationImages();
    await images.setUploadedImages(conversation.id, [
      image('image', conversation.conversationId),
    ]);

    await images.snapshotImageSelections(conversation.id);
    await images.deselectAllImages(conversation.id);
    expect(conversation.uploadedImages[0].selected).toBe(false);

    await images.restoreImageSelections(conversation.id);
    expect(conversation.uploadedImages[0].selected).toBe(true);
    images.clearImageSelectionSnapshot(conversation.id);
    expect(conversation.imageSelectionSnapshot).toEqual({});

    await images.toggleUploadedImageSelected(
      conversation.id,
      'image',
      conversation.conversationId,
    );
    expect(conversation.uploadedImages[0].selected).toBe(false);
    await images.removeUploadedImage(
      conversation.id,
      'image',
      conversation.conversationId,
    );
    expect(conversation.uploadedImages).toHaveLength(0);
  });

  it('updates whole pdf page groups and skips unmatched groups', async () => {
    const conversation = seed();
    const images = useConversationImages();
    await images.setUploadedImages(conversation.id, [
      image('page-1', conversation.conversationId, 'pdf'),
      image('page-2', conversation.conversationId, 'pdf'),
    ]);
    persistence.persistConversation.mockClear();

    await images.setUploadedImagesSelectedForParent(
      conversation.id,
      'pdf',
      false,
      conversation.conversationId,
    );
    expect(conversation.uploadedImages.every((image) => !image.selected)).toBe(
      true,
    );

    await images.removeUploadedImagesForParent(
      conversation.id,
      'missing',
      conversation.conversationId,
    );
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);

    await images.removeUploadedImagesForParent(
      conversation.id,
      'pdf',
      conversation.conversationId,
    );
    expect(conversation.uploadedImages).toHaveLength(0);
    expect(persistence.persistConversation).toHaveBeenCalledTimes(2);
  });

  it('clears selection snapshots synchronously even on stubs', () => {
    const conversation = seed();
    conversation.loaded = false;
    conversation.imageSelectionSnapshot = { image: true };

    useConversationImages().clearImageSelectionSnapshot(conversation.id);

    expect(conversation.imageSelectionSnapshot).toEqual({});
    expect(persistence.persistConversation).not.toHaveBeenCalled();
  });

  it('does nothing for unknown records', async () => {
    await useConversationImages().setUploadedImages('missing', []);

    expect(catalog.loadConversationForWrite).toHaveBeenCalledWith('missing');
    expect(persistence.persistConversation).not.toHaveBeenCalled();
  });
});

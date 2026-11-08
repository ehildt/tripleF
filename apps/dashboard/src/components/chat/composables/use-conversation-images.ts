import { buildImageSelectionSnapshot } from '@/components/chat/composables/helpers/build-image-selection-snapshot.helper';
import { restoreUploadedImageSelections } from '@/components/chat/composables/helpers/restore-uploaded-image-selections.helper';
import { setUploadedImagesSelectedForParent } from '@/components/chat/composables/helpers/set-uploaded-images-selected-for-parent.helper';
import { toggleUploadedImageSelection } from '@/components/chat/composables/helpers/toggle-uploaded-image-selection.helper';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import type {
  Conversation,
  UploadedImage,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { mergeUploadedImages } from '@/stores/chat/conversation/helpers/merge-uploaded-images.helper';

interface ConversationImages {
  setUploadedImages: (
    conversationStoreId: string,
    images: UploadedImage[],
  ) => Promise<void>;
  toggleUploadedImageSelected: (
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ) => Promise<void>;
  snapshotImageSelections: (conversationStoreId: string) => Promise<void>;
  restoreImageSelections: (conversationStoreId: string) => Promise<void>;
  clearImageSelectionSnapshot: (conversationStoreId: string) => void;
  deselectAllImages: (conversationStoreId: string) => Promise<void>;
  removeUploadedImage: (
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ) => Promise<void>;
  setUploadedImagesSelectedForParent: (
    conversationStoreId: string,
    parentHash: string,
    selected: boolean,
    targetConversationId?: string,
  ) => Promise<void>;
  removeUploadedImagesForParent: (
    conversationStoreId: string,
    parentHash: string,
    targetConversationId?: string,
  ) => Promise<void>;
}

/** Own uploaded-image commands, selection snapshots, and their persistence. */
export function useConversationImages(): ConversationImages {
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const persistence = useConversationPersistence();

  function write(
    conversationStoreId: string,
    mutation: (conversation: Conversation) => boolean,
  ): Promise<void> {
    const apply = (conversation: Conversation) => {
      if (!mutation(conversation)) return Promise.resolve();
      return persistence.persistConversation(conversation);
    };
    const current = conversationStore.getConversation(conversationStoreId);
    if (current?.loaded) return apply(current);
    return catalog
      .loadConversationForWrite(conversationStoreId)
      .then((conversation) => {
        if (conversation) return apply(conversation);
      });
  }

  function setUploadedImages(
    conversationStoreId: string,
    images: UploadedImage[],
  ): Promise<void> {
    return write(conversationStoreId, (conversation) =>
      conversationStore.patchConversationMedia(conversationStoreId, {
        uploadedImages: mergeUploadedImages(
          conversation.uploadedImages,
          images,
          conversation.conversationId,
        ),
      }),
    );
  }

  function toggleUploadedImageSelected(
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const next = toggleUploadedImageSelection(
        conversation.uploadedImages,
        hash,
        targetConversationId ?? conversation.conversationId,
      );
      return next
        ? conversationStore.patchConversationMedia(conversationStoreId, {
            uploadedImages: next,
          })
        : false;
    });
  }

  function snapshotImageSelections(conversationStoreId: string): Promise<void> {
    return write(conversationStoreId, (conversation) =>
      conversationStore.patchConversationMedia(conversationStoreId, {
        imageSelectionSnapshot: buildImageSelectionSnapshot(
          conversation.uploadedImages,
          conversation.conversationId,
        ),
      }),
    );
  }

  function restoreImageSelections(conversationStoreId: string): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      if (Object.keys(conversation.imageSelectionSnapshot).length === 0) {
        return false;
      }
      return conversationStore.patchConversationMedia(conversationStoreId, {
        uploadedImages: restoreUploadedImageSelections(
          conversation.uploadedImages,
          conversation.imageSelectionSnapshot,
          conversation.conversationId,
        ),
      });
    });
  }

  function clearImageSelectionSnapshot(conversationStoreId: string): void {
    conversationStore.clearImageSelectionSnapshot(conversationStoreId);
  }

  function deselectAllImages(conversationStoreId: string): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const serverId = conversation.conversationId;
      return conversationStore.patchConversationMedia(conversationStoreId, {
        uploadedImages: conversation.uploadedImages.map((image) =>
          (image.conversationId ?? serverId) === serverId
            ? { ...image, selected: false }
            : image,
        ),
      });
    });
  }

  function removeUploadedImage(
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const serverId = targetConversationId ?? conversation.conversationId;
      return conversationStore.patchConversationMedia(conversationStoreId, {
        uploadedImages: conversation.uploadedImages.filter(
          (image) =>
            !(
              image.hash === hash &&
              (image.conversationId ?? serverId) === serverId
            ),
        ),
      });
    });
  }

  function setImagesSelectedForParent(
    conversationStoreId: string,
    parentHash: string,
    selected: boolean,
    targetConversationId?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const next = setUploadedImagesSelectedForParent(
        conversation.uploadedImages,
        parentHash,
        selected,
        targetConversationId ?? conversation.conversationId,
      );
      return next
        ? conversationStore.patchConversationMedia(conversationStoreId, {
            uploadedImages: next,
          })
        : false;
    });
  }

  function removeUploadedImagesForParent(
    conversationStoreId: string,
    parentHash: string,
    targetConversationId?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const serverId = targetConversationId ?? conversation.conversationId;
      const next = conversation.uploadedImages.filter(
        (image) =>
          !(
            image.parentHash === parentHash &&
            (image.conversationId ?? serverId) === serverId
          ),
      );
      return next.length === conversation.uploadedImages.length
        ? false
        : conversationStore.patchConversationMedia(conversationStoreId, {
            uploadedImages: next,
          });
    });
  }

  return {
    setUploadedImages,
    toggleUploadedImageSelected,
    snapshotImageSelections,
    restoreImageSelections,
    clearImageSelectionSnapshot,
    deselectAllImages,
    removeUploadedImage,
    setUploadedImagesSelectedForParent: setImagesSelectedForParent,
    removeUploadedImagesForParent,
  };
}

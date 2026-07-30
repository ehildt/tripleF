import type { UploadedImage } from '@/stores/conversation';
import type { ConversationMetadata } from '@/utils/build-query-params.helper';

/**
 * Build the conversation metadata attached to a submit request: every
 * toolbar-selected file reference plus the still-selected persisted uploads
 * of the conversation that were not part of the current selection. Derived
 * variants (resized copies etc.) are excluded — only originals travel with
 * the request.
 */
export function buildConversationMetadata(
  referencedImages: UploadedImage[],
  uploadedImages: UploadedImage[],
  conversationId: string,
): ConversationMetadata {
  const selectedToolbarHashes = new Set(
    referencedImages.map((img) => img.hash),
  );
  const persistedSelectedImages = uploadedImages.filter(
    (img) =>
      img.conversationId === conversationId &&
      img.selected !== false &&
      !selectedToolbarHashes.has(img.hash),
  );

  return {
    images: [...referencedImages, ...persistedSelectedImages]
      .filter(
        (img) =>
          !('variant' in img) || !img.variant || img.variant === 'original',
      )
      .map(({ name, hash }) => ({ name, hash })),
  };
}

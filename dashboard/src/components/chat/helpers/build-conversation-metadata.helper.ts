import type { UploadedImage } from '@/stores/conversation';
import type { ConversationMetadata } from '@/types/form-query-params.model';

/**
 * Build the conversation metadata attached to a submit request: every
 * toolbar-selected file reference plus the still-selected persisted uploads
 * of the conversation that were not part of the current selection. Derived
 * variants (resized copies etc.) are excluded — only originals travel with
 * the request. A merge submit additionally carries the request ids of the
 * exchanges the model should consolidate.
 */
export function buildConversationMetadata(
  referencedImages: UploadedImage[],
  uploadedImages: UploadedImage[],
  conversationId: string,
  mergeFromRequestIds?: string[],
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

  const metadata: ConversationMetadata = {
    images: [...referencedImages, ...persistedSelectedImages]
      .filter(
        (img) =>
          !('variant' in img) || !img.variant || img.variant === 'original',
      )
      .map(({ name, hash }) => ({ name, hash })),
  };

  if (mergeFromRequestIds?.length) {
    metadata.merge = { fromRequestIds: mergeFromRequestIds };
  }

  return metadata;
}

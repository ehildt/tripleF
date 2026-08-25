import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { extractStorageImageHash } from './helpers/media/extract-storage-image-hash.helper';

/** The image shape every add-to-files surface provides. */
export interface AddableImage {
  imageUrl: string;
  title?: string;
  imageAlt?: string;
  source?: string;
}

/**
 * Add-to-files membership toggle for one gallery image: whether the image is
 * registered as a conversation file, and an action that adds or removes it.
 * Web images are ingested into MinIO by the server (the storage URL's last
 * segment is the object's content hash), so adding is a pure registration —
 * the entry joins the conversation's uploaded images, the Files tab shows
 * it, and the next prompt references the stored object so the user can ask
 * about it.
 *
 * Any storage-URL image is toggleable except the user's own uploads
 * (`source: 'local'` — already files). External images and blob object
 * URLs carry no storage hash and are not. The `source` field is not
 * required — several data paths (old persisted exchanges, tool-result
 * synthesis during streaming) omit it while the image is still stored.
 * Adding is idempotent: the conversation store dedupes by content hash.
 */
export function useAddImageToFiles(
  item: MaybeRefOrGetter<AddableImage | null>,
) {
  const conversationStore = useConversationStore();

  const canAddToFiles = computed(() => {
    const image = toValue(item);
    if (!image || image.source === 'local') return false;
    return extractStorageImageHash(image.imageUrl) !== null;
  });

  const isInFiles = computed(() => {
    const image = toValue(item);
    const hash = image ? extractStorageImageHash(image.imageUrl) : null;
    const sessionId = conversationStore.activeConversationId;
    if (!hash || !sessionId) return false;
    return conversationStore
      .getUploadedImagesForConversation(sessionId)
      .some((img) => img.hash === hash);
  });

  function toggleAddToFiles() {
    const image = toValue(item);
    const hash = image ? extractStorageImageHash(image.imageUrl) : null;
    const sessionId = conversationStore.activeConversationId;
    if (!image || !hash || !sessionId) return;

    if (isInFiles.value) {
      conversationStore.removeUploadedImage(sessionId, hash);
      return;
    }

    conversationStore.setUploadedImages(sessionId, [
      {
        // The file entry's display name: the gallery title (the search
        // result's name) with the content hash as the stable fallback.
        name: image.imageAlt?.trim() || image.title?.trim() || hash,
        hash,
        uploadedAt: Date.now(),
        selected: true,
        source: 'cloud',
        conversationId: conversationStore.getConversationId(sessionId),
      },
    ]);
  }

  return { canAddToFiles, isInFiles, toggleAddToFiles };
}

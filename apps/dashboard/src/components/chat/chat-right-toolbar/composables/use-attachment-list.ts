import { computed } from 'vue';

import { useAttachedFilesStore } from '@/stores/attached-files';
import { useConversationStore } from '@/stores/conversation';

import { groupUploadedImages } from './helpers/group-uploaded-images.helper';
import { mapPendingAttachment } from './helpers/map-pending-attachment.helper';
import { mapUploadedDocumentAttachment } from './helpers/map-uploaded-document-attachment.helper';
import { mapUploadedImageAttachment } from './helpers/map-uploaded-image-attachment.helper';
import { mapUploadedImageGallery } from './helpers/map-uploaded-image-gallery.helper';
import type { AttachmentItem } from './use-attachment-list.types';

/**
 * Normalizes pending attached files and uploaded image metadata into a
 * single list for the merged Files panel. Pdf page images are grouped into
 * one gallery per source document; the source document itself is hidden
 * because its pages represent it. Composes the attached-files and
 * conversation stores by import.
 */
export function useAttachmentList() {
  const conversationStore = useConversationStore();
  const attachedFilesStore = useAttachedFilesStore();

  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );
  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  /** The stable server conversationId (mapped from the internal id). */
  const conversationId = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id) return '';
    return conversationStore.getConversationId(conversation.id);
  });

  const attachedFiles = computed(() => attachedFilesStore.attachedFiles);
  const uploadedImages = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id || !conversationId.value) return [];
    return conversationStore.getUploadedImagesForConversation(
      conversation.id,
      conversationId.value,
    );
  });
  const uploadedDocuments = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id || !conversationId.value) return [];
    return conversationStore.getUploadedDocumentsForConversation(
      conversation.id,
      conversationId.value,
    );
  });

  const attachments = computed<AttachmentItem[]>(() => {
    const grouped = groupUploadedImages(uploadedImages.value);
    const parentHashes = new Set<string>();
    for (const item of grouped) {
      if (item.kind === 'gallery') parentHashes.add(item.group.parentHash);
    }

    const pending: AttachmentItem[] = attachedFiles.value
      .filter((entry) => !parentHashes.has(entry.hash))
      .map(mapPendingAttachment);

    const uploaded: AttachmentItem[] = grouped.map((item) =>
      item.kind === 'gallery'
        ? mapUploadedImageGallery(item.group)
        : mapUploadedImageAttachment(item.image),
    );

    const uploadedDocs: AttachmentItem[] = uploadedDocuments.value
      .filter((doc) => !parentHashes.has(doc.hash))
      .map(mapUploadedDocumentAttachment);

    return [...pending, ...uploaded, ...uploadedDocs];
  });

  const hasAttachments = computed(() => attachments.value.length > 0);

  return {
    attachments,
    hasAttachments,
  };
}

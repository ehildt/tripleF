import { computed } from 'vue';

import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { getUploadedDocumentsForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-documents-for-conversation.helper';
import { getUploadedImagesForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-images-for-conversation.helper';

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
  const conversationSession = useConversationSession();
  const { attachedFiles } = usePendingAttachments();

  const activeConversationId = computed(
    () => conversationSession.activeConversationId.value ?? '',
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

  const uploadedImages = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id || !conversationId.value) return [];
    return getUploadedImagesForConversation(conversation, conversationId.value);
  });
  const uploadedDocuments = computed(() => {
    const conversation = activeConversation.value;
    if (!conversation?.id || !conversationId.value) return [];
    return getUploadedDocumentsForConversation(
      conversation,
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

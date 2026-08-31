import { computed } from 'vue';

import { mapPendingAttachment } from './helpers/map-pending-attachment.helper';
import { mapUploadedDocumentAttachment } from './helpers/map-uploaded-document-attachment.helper';
import { mapUploadedImageAttachment } from './helpers/map-uploaded-image-attachment.helper';
import type {
  AttachmentItem,
  UseAttachmentListOptions,
} from './use-attachment-list.types';

/**
 * Normalizes pending attached files and uploaded image metadata into a
 * single list for the merged Files panel.
 */
export function useAttachmentList(options: UseAttachmentListOptions) {
  const { attachedFiles, uploadedImages, uploadedDocuments } = options;

  const attachments = computed<AttachmentItem[]>(() => {
    const pending: AttachmentItem[] =
      attachedFiles.value.map(mapPendingAttachment);

    const uploaded: AttachmentItem[] = uploadedImages.value.map(
      mapUploadedImageAttachment,
    );

    const uploadedDocs: AttachmentItem[] = uploadedDocuments.value.map(
      mapUploadedDocumentAttachment,
    );

    return [...pending, ...uploaded, ...uploadedDocs];
  });

  const hasAttachments = computed(() => attachments.value.length > 0);

  return {
    attachments,
    hasAttachments,
  };
}

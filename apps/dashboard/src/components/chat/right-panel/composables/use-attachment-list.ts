import { computed } from 'vue';

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
    const pending: AttachmentItem[] = attachedFiles.value.map(
      (entry, index) => ({
        id: `pending-${entry.hash}-${index}`,
        name: entry.file.name,
        hash: entry.hash,
        previewUrl: entry.objectUrl,
        isUploaded: false,
        isSelected: entry.isSelected,
        pendingIndex: index,
        source: 'local',
        kind: entry.kind,
      }),
    );

    const uploaded: AttachmentItem[] = uploadedImages.value.map((image) => ({
      id: `uploaded-${image.hash}`,
      name: image.name,
      hash: image.hash,
      previewUrl: '',
      isUploaded: true,
      isSelected: image.selected !== false,
      pendingIndex: null,
      source: image.source ?? 'local',
      kind: 'image',
    }));

    const uploadedDocs: AttachmentItem[] = uploadedDocuments.value.map(
      (doc) => ({
        id: `uploaded-document-${doc.hash}`,
        name: doc.name,
        hash: doc.hash,
        previewUrl: '',
        isUploaded: true,
        isSelected: doc.selected !== false,
        pendingIndex: null,
        source: 'local',
        kind: 'document',
      }),
    );

    return [...pending, ...uploaded, ...uploadedDocs];
  });

  const hasAttachments = computed(() => attachments.value.length > 0);

  return {
    attachments,
    hasAttachments,
  };
}

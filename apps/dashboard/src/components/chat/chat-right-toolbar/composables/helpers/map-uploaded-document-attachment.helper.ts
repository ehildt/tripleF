import type { UploadedDocument } from '@/stores/conversation';

import type { AttachmentItem } from '../use-attachment-list.types';

/** Normalize an uploaded document into an attachment item. */
export function mapUploadedDocumentAttachment(
  doc: UploadedDocument,
): AttachmentItem {
  return {
    id: `uploaded-document-${doc.hash}`,
    name: doc.name,
    hash: doc.hash,
    previewUrl: '',
    isUploaded: true,
    isSelected: doc.selected !== false,
    pendingIndex: null,
    source: 'local',
    size: doc.size,
    kind: 'document',
  };
}

import type { UploadedImage } from '@/stores/conversation';

import type { AttachmentItem } from '../use-attachment-list.types';

/** Normalize an uploaded image into an attachment item. */
export function mapUploadedImageAttachment(
  image: UploadedImage,
): AttachmentItem {
  return {
    id: `uploaded-${image.hash}`,
    name: image.name,
    hash: image.hash,
    previewUrl: '',
    isUploaded: true,
    isSelected: image.selected !== false,
    pendingIndex: null,
    source: image.source ?? 'local',
    kind: 'image',
  };
}

import type { UploadedImage } from '@/stores/chat/conversation/conversation.model';

import type { UploadedResponseImageEntry } from './map-entry-to-uploaded-image.helper.types';

/** Normalize a validated response entry into an uploaded image. */
export function mapEntryToUploadedImage(
  entry: UploadedResponseImageEntry,
  conversationId: string,
  uploadedAt: number,
): UploadedImage {
  return {
    name: entry.name,
    hash: entry.hash,
    size: entry.size,
    uploadedAt,
    selected: true,
    conversationId,
    source: entry.source === 'cloud' ? 'cloud' : 'local',
  };
}

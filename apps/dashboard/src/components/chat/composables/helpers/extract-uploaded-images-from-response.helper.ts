import type { UploadedImage } from '@/stores/chat/conversation/conversation.model';
import type { AssistantResponseMetadata } from '@/types/assistant-socket-event.model';

import { mapEntryToUploadedImage } from './map-entry-to-uploaded-image.helper';
import type { UploadedResponseImageEntry } from './map-entry-to-uploaded-image.helper.types';

function isOriginalResponseMetadata(
  entry: unknown,
): entry is UploadedResponseImageEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const candidate = entry as AssistantResponseMetadata;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.hash === 'string' &&
    (!candidate.variant || candidate.variant === 'original')
  );
}

/**
 * Extract original uploaded-image entries from untrusted response metadata.
 * Derived variants and entries missing a name or hash are skipped.
 */
export function extractUploadedImagesFromResponse(
  meta: unknown,
  conversationId: string,
  uploadedAt: number,
): UploadedImage[] {
  if (!Array.isArray(meta)) return [];
  const entries: unknown[] = meta;
  return entries
    .filter(isOriginalResponseMetadata)
    .map((entry) => mapEntryToUploadedImage(entry, conversationId, uploadedAt));
}

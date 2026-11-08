import type { UploadedImage } from '@/stores/chat/conversation/conversation.model';

/** Capture selected state for images in one stable conversation context. */
export function buildImageSelectionSnapshot(
  images: UploadedImage[],
  serverConversationId: string,
): Record<string, boolean> {
  const snapshot: Record<string, boolean> = {};
  for (const image of images) {
    if (
      (image.conversationId ?? serverConversationId) !== serverConversationId
    ) {
      continue;
    }
    snapshot[image.hash] = image.selected !== false;
  }
  return snapshot;
}

import type { UploadedImage } from '@/stores/chat/conversation/conversation.model';

/** Restore a previously captured selection snapshot without mutating its input. */
export function restoreUploadedImageSelections(
  images: UploadedImage[],
  snapshot: Record<string, boolean>,
  serverConversationId: string,
): UploadedImage[] {
  return images.map((image) => {
    if (
      (image.conversationId ?? serverConversationId) !== serverConversationId
    ) {
      return image;
    }
    const selected = snapshot[image.hash];
    return selected === undefined ? image : { ...image, selected };
  });
}

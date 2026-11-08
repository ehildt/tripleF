import type { UploadedImage } from '@/stores/chat/conversation/conversation.model';

/** Toggle one scoped image selection, returning null when no image matches. */
export function toggleUploadedImageSelection(
  images: UploadedImage[],
  hash: string,
  serverConversationId: string,
): UploadedImage[] | null {
  let found = false;
  const next = images.map((image) => {
    if (
      image.hash !== hash ||
      (image.conversationId ?? serverConversationId) !== serverConversationId
    ) {
      return image;
    }
    found = true;
    return { ...image, selected: image.selected === false };
  });
  return found ? next : null;
}

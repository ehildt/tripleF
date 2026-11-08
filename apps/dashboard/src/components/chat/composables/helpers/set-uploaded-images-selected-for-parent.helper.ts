import type { UploadedImage } from '@/stores/chat/conversation/conversation.model';

/** Set selection for one scoped PDF page group, or return null when absent. */
export function setUploadedImagesSelectedForParent(
  images: UploadedImage[],
  parentHash: string,
  selected: boolean,
  serverConversationId: string,
): UploadedImage[] | null {
  let changed = false;
  const next = images.map((image) => {
    if (
      image.parentHash !== parentHash ||
      (image.conversationId ?? serverConversationId) !== serverConversationId
    ) {
      return image;
    }
    changed = true;
    return { ...image, selected };
  });
  return changed ? next : null;
}

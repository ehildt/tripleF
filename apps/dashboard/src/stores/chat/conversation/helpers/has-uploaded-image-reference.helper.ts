import type { Conversation } from '../conversation.model';

/** Check whether an image hash remains referenced outside an excluded context. */
export function hasUploadedImageReference(
  conversation: Conversation | undefined,
  hash: string,
  excludeConversationId?: string,
): boolean {
  return Boolean(
    conversation?.uploadedImages.some(
      (image) =>
        image.hash === hash &&
        (!excludeConversationId ||
          image.conversationId !== excludeConversationId),
    ),
  );
}

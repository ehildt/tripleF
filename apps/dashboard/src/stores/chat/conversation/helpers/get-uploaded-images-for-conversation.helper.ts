import type { Conversation, UploadedImage } from '../conversation.model';

/** Select uploaded images belonging to one stable conversation context. */
export function getUploadedImagesForConversation(
  conversation: Conversation | undefined,
  targetConversationId?: string,
): UploadedImage[] {
  if (!conversation) return [];
  const serverId = targetConversationId ?? conversation.conversationId;
  return conversation.uploadedImages.filter(
    (image) => (image.conversationId ?? serverId) === serverId,
  );
}

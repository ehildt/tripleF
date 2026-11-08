import type { Conversation, UploadedDocument } from '../conversation.model';

/** Select uploaded documents belonging to one stable conversation context. */
export function getUploadedDocumentsForConversation(
  conversation: Conversation | undefined,
  targetConversationId?: string,
): UploadedDocument[] {
  if (!conversation) return [];
  const serverId = targetConversationId ?? conversation.conversationId;
  return conversation.uploadedDocuments.filter(
    (document) => (document.conversationId ?? serverId) === serverId,
  );
}

import type { Conversation } from '../conversation.model';
import type { ConversationContextPartition } from './partition-conversation-context.helper.types';

/** Partition one conversation record into retained data and images removed with a stable context. */
export function partitionConversationContext(
  conversation: Conversation,
  serverConversationId: string,
): ConversationContextPartition {
  const removedImages = conversation.uploadedImages.filter(
    (image) =>
      (image.conversationId ?? serverConversationId) === serverConversationId,
  );
  return {
    exchanges: conversation.exchanges.filter(
      (exchange) =>
        (exchange.conversationId ?? serverConversationId) !==
        serverConversationId,
    ),
    uploadedImages: conversation.uploadedImages.filter(
      (image) =>
        (image.conversationId ?? serverConversationId) !== serverConversationId,
    ),
    removedImages,
  };
}

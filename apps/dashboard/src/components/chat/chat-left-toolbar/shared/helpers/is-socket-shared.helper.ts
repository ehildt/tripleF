import { isConversationBoundToSocket } from './is-conversation-bound-to-socket.helper';
import type { SocketListeningConversation } from './is-socket-shared.helper.types';

/**
 * True when another conversation (excluding the given one) still listens on
 * the same socket, identified by its event+room pair — either as its own
 * binding or through an extra subscription.
 */
export function isSocketShared(
  conversations: SocketListeningConversation[],
  excludeConversationId: string,
  event: string,
  roomId: string,
): boolean {
  return conversations.some(
    (conversation) =>
      conversation.id !== excludeConversationId &&
      isConversationBoundToSocket(conversation, event, roomId),
  );
}

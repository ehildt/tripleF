interface SocketListeningConversation {
  id: string;
  event?: string;
  roomId?: string;
  subscriptions?: { event: string; roomId?: string }[];
}

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
      ((conversation.event === event &&
        (conversation.roomId ?? '') === roomId) ||
        conversation.subscriptions?.some(
          (subscription) =>
            subscription.event === event &&
            (subscription.roomId ?? '') === roomId,
        )),
  );
}

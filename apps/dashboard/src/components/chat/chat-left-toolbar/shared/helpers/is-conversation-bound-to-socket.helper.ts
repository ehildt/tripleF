/** A conversation's socket bindings: its own event/room plus extra subscriptions. */
type ConversationSocketBinding = {
  event?: string;
  roomId?: string;
  subscriptions?: { event: string; roomId?: string }[];
};

/**
 * True when the conversation listens on the given socket — either as its own
 * event/room binding or through one of its extra subscriptions. Room ids are
 * normalized so an unset room matches an empty-string room.
 */
export function isConversationBoundToSocket(
  conversation: ConversationSocketBinding,
  event: string,
  roomId: string,
): boolean {
  return (
    (conversation.event === event && (conversation.roomId ?? '') === roomId) ||
    (conversation.subscriptions?.some(
      (subscription) =>
        subscription.event === event && (subscription.roomId ?? '') === roomId,
    ) ??
      false)
  );
}

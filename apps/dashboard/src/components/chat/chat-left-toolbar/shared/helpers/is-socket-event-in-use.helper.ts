/** The event a subscription entry is bound to. */
type SocketSubscription = {
  event: string;
};

/** A conversation's socket-event usage: its own binding plus extra subscriptions. */
type SocketEventConsumer = {
  id: string;
  event?: string;
  subscriptions?: SocketSubscription[];
};

/**
 * True when the socket event is still used on any room: by another
 * conversation (own binding or extra subscription) or by a remaining
 * subscription entry.
 */
export function isSocketEventInUse(
  conversations: SocketEventConsumer[],
  subscriptions: SocketSubscription[],
  excludeConversationId: string,
  event: string,
): boolean {
  const usedByConversation = conversations.some(
    (conversation) =>
      conversation.id !== excludeConversationId &&
      (conversation.event === event ||
        conversation.subscriptions?.some(
          (subscription) => subscription.event === event,
        )),
  );
  return (
    usedByConversation ||
    subscriptions.some((subscription) => subscription.event === event)
  );
}

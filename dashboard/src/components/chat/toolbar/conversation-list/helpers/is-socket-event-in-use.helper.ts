import type { SocketEventConsumer } from './is-socket-event-in-use.helper.types';

/**
 * True when the socket event is still used on any room: by another
 * conversation (own binding or extra subscription) or by a remaining
 * subscription entry.
 */
export function isSocketEventInUse(
  conversations: SocketEventConsumer[],
  subscriptions: { event: string }[],
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

import { isConversationBoundToSocket } from './is-conversation-bound-to-socket.helper';

/** A socket subscription whose event+room pair names a map key. */
type SubscriptionEventRoom = { event: string; roomId: string };
/** A conversation read for its title and socket bindings. */
type ConversationTitle = {
  title: string;
  event?: string;
  roomId?: string;
  subscriptions?: { event: string; roomId?: string }[];
};

/**
 * Map each subscription's `event::room` key to the titles of every
 * conversation bound to that socket, for the subscribed list's
 * linked-conversations labels.
 */
export function buildConversationNamesByEvent(
  subscriptions: SubscriptionEventRoom[],
  conversations: ConversationTitle[],
): Record<string, string[]> {
  const namesByEvent: Record<string, string[]> = {};
  for (const subscription of subscriptions) {
    const key = `${subscription.event}::${subscription.roomId}`;
    namesByEvent[key] = conversations
      .filter((conversation) =>
        isConversationBoundToSocket(
          conversation,
          subscription.event,
          subscription.roomId,
        ),
      )
      .map((conversation) => conversation.title || '(untitled)');
  }
  return namesByEvent;
}

import type { SubscriptionEntry } from '@/types/subscription.model';

export interface SocketsProps {
  /** Subscribed sockets to render. */
  subscriptions: readonly SubscriptionEntry[];
  /** Conversation titles per `event::room` key (for the linked-conversations icon). */
  conversationNamesByEvent: Record<string, string[]>;
}

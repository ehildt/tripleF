import type { SubscriptionEntry } from '@/types/subscription.model';

export interface SubscribedEventItemProps {
  /** The socket subscription to render. */
  subscription: SubscriptionEntry;
  /** Conversation titles bound to this subscription (linked-conversations icon). */
  conversationNames: string[];
}

import type { Conversation } from '@/stores/conversation';
import type { SubscriptionEntry } from '@/types/subscription.model';

export interface TabsProps {
  /** Conversations to render in the conversations section. */
  conversations: readonly Conversation[];
  /** Id of the active conversation. */
  activeConversationId: string | null;
  /** Temporary-conversation retention in minutes (expiry tooltip). */
  temporaryRetentionMinutes: number;
  /** Subscribed sockets to render in the sockets section. */
  subscriptions: readonly SubscriptionEntry[];
  /** Conversation titles per `event::room` key (for the linked-conversations icon). */
  conversationNamesByEvent: Record<string, string[]>;
}

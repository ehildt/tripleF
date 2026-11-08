import type { Conversation } from '@/stores/chat/conversation/conversation.model';

export interface ConversationListProps {
  /** Conversations to render (the list sorts by recency). */
  conversations: readonly Conversation[];
  /** Id of the active conversation, highlighted in the list. */
  activeConversationId: string | null;
  /** Temporary-conversation retention in minutes (expiry tooltip). */
  temporaryRetentionMinutes: number;
}

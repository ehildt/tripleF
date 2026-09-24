import type { Conversation } from '@/stores/conversation';

export interface ConversationListProps {
  /** Conversations to render (the list sorts by recency). */
  conversations: readonly Conversation[];
  /** Id of the active conversation, highlighted in the list. */
  activeConversationId: string | null;
}

import type { Conversation } from '@/stores/conversation';

export interface ConversationsProps {
  /** Conversations to render. */
  conversations: readonly Conversation[];
  /** Id of the active conversation, highlighted in the list. */
  activeConversationId: string | null;
  /** Temporary-conversation retention in minutes (expiry tooltip). */
  temporaryRetentionMinutes: number;
}

import type { Conversation } from '@/stores/chat/conversation/conversation.model';

export interface ConversationsProps {
  /** Conversations to render. */
  conversations: readonly Conversation[];
  /** Id of the active conversation, highlighted in the list. */
  activeConversationId: string | null;
  /** Temporary-conversation retention in minutes (expiry tooltip). */
  temporaryRetentionMinutes: number;
}

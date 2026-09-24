import type { Conversation } from '@/stores/conversation';

export interface ConversationItemProps {
  /** The conversation to render. */
  conversation: Conversation;
  /** Whether this is the active conversation (un-dims the row). */
  isActive: boolean;
  /** Formatted context-usage percentage, or null when unknown. */
  contextUsagePercent: string | null;
  /** Expiry label for temporary conversations (shown in the pin tooltip). */
  expiresLabel?: string;
}

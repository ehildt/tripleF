import type { MessageListItem } from '@/components/shared/ui/expandable-message-list/types';

export interface ChatRightToolbarProps {
  /** History items (user exchanges mapped to list rows). */
  messageListItems: MessageListItem[];
  /** Id of the user exchange whose section is currently active in the carousel. */
  activeUserExchangeId?: string | null;
  /** False when the conversation has fewer than two merge candidates. */
  canMerge: boolean;
  /** True when at least two user prompts are selected (merge icons pulse). */
  mergeArmed: boolean;
}

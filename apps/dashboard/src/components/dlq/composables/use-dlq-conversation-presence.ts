import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { extractEntryFilters } from '../helpers/extract-entry-filters.helper';

/** Derive deleted-conversation badges from hydrated conversation state. */
export function useDlqConversationPresence() {
  const conversationStore = useConversationStore();

  function isConversationDeleted(entry: DlqEntry): boolean {
    if (entry.queueName !== 'harness' || !conversationStore.hydrated)
      return false;

    const { conversationId } = extractEntryFilters(entry);
    return !conversationStore.conversations.some(
      (conversation) => conversation.conversationId === conversationId,
    );
  }

  return { isConversationDeleted };
}

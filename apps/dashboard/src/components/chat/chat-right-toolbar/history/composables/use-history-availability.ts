import { computed } from 'vue';

import { useConversationStore } from '@/stores/conversation';

/**
 * Whether the chat right toolbar's History section has content — any user
 * exchange in the active conversation. Split out of `useHistoryPanel` so the
 * toolbar can read the tab-visibility flag without instantiating the full
 * history view-model (merge selection, branching, clipboard, context options).
 * `useHistoryPanel` derives the same flag from its already-computed user
 * exchange list, so both stay in lockstep off the same store.
 */
export function useHistoryAvailability() {
  const conversationStore = useConversationStore();

  const hasHistory = computed(() => {
    const conversationId = conversationStore.activeConversationId ?? '';
    const conversation = conversationId
      ? conversationStore.getConversation(conversationId)
      : null;
    if (!conversation) return false;
    return conversation.exchanges.some((exchange) => exchange.role === 'user');
  });

  return { hasHistory };
}

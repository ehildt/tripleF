import { computed } from 'vue';

import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import type {
  ActiveSession,
  ActiveSessionData,
} from './use-active-conversation.types';

/**
 * Provide the currently active conversation and its exchanges, or `null`/`[]`
 * when no conversation is selected. Also exposes the id of the most recent
 * assistant exchange that is still pending or streaming, and whether that
 * exchange has started receiving response content — both drive auto-scroll
 * behavior.
 */
export function useActiveConversation(): ActiveSessionData {
  const conversationStore = useConversationStore();

  const activeConversation = computed<ActiveSession | null>(() => {
    const id = conversationStore.activeConversationId;
    if (!id) return null;
    return conversationStore.getConversation(id) ?? null;
  });

  const exchanges = computed<readonly Exchange[]>(() =>
    (activeConversation.value?.exchanges ?? []).filter(
      (exchange) =>
        // Excluded exchanges drop out of the list — except merged-away ones,
        // which stay visible (purple) so the user can see what the unified
        // response consolidated.
        exchange.included !== false || exchange.mergedInto != null,
    ),
  );

  const activeAssistantExchangeId = computed<string | null>(() => {
    for (let i = exchanges.value.length - 1; i >= 0; i--) {
      const exchange = exchanges.value[i];
      if (
        exchange?.role === 'assistant' &&
        (exchange.status === 'pending' || exchange.status === 'streaming')
      ) {
        return exchange.id;
      }
    }
    return null;
  });

  // The store flips an exchange from pending to streaming exactly when the
  // first response delta arrives (reasoning is cleared at the same moment),
  // so this marks "reasoning done, response content has started".
  const activeAssistantResponseStarted = computed<boolean>(() => {
    const id = activeAssistantExchangeId.value;
    if (!id) return false;
    return (
      exchanges.value.find((exchange) => exchange.id === id)?.status ===
      'streaming'
    );
  });

  /**
   * True while the main column should show the loading skeleton instead of
   * content: before the conversation list has hydrated, or while the active
   * conversation's full content is still being fetched.
   */
  const isExchangesLoading = computed<boolean>(() => {
    const active = activeConversation.value;
    // `ActiveSession` is `Conversation | undefined` — cover both nullish
    // shapes so the stub's `loaded` flag is only read when it exists.
    return !conversationStore.hydrated || (active != null && !active.loaded);
  });

  return {
    activeConversation,
    exchanges,
    activeAssistantExchangeId,
    activeAssistantResponseStarted,
    isExchangesLoading,
  };
}

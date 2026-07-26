import { computed, type ComputedRef } from 'vue';

import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

type ActiveSession = ReturnType<
  ReturnType<typeof useConversationStore>['getConversation']
>;

export interface ActiveSessionData {
  activeConversation: ComputedRef<ActiveSession | null>;
  exchanges: ComputedRef<readonly Exchange[]>;
  activeAssistantExchangeId: ComputedRef<string | null>;
}

/**
 * Provide the currently active conversation and its exchanges, or `null`/`[]`
 * when no conversation is selected. Also exposes the id of the most recent
 * assistant exchange that is still pending or streaming, which is used to
 * drive auto-scroll behavior.
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
      (exchange) => exchange.included !== false,
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

  return {
    activeConversation,
    exchanges,
    activeAssistantExchangeId,
  };
}

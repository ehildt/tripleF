import { computed, type Ref } from 'vue';

import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import { calcPromptContextPercentage } from '../../../../shared/helpers/calc-token-percent.helper';

/**
 * Compute the context-window percentage a user prompt (plus its assistant
 * response) occupies. Returns null until the assistant exchange is done and
 * token data is available — the header renders nothing in that case.
 */
export function usePromptContextPercent(
  exchange: Ref<Exchange>,
  isUser: Ref<boolean>,
) {
  const conversationStore = useConversationStore();

  const assistantForPrompt = computed(() => {
    if (!isUser.value || !exchange.value.requestId) return null;
    const conversation = conversationStore.getConversation(
      conversationStore.activeConversationId ?? '',
    );
    if (!conversation) return null;
    return conversation.exchanges.find(
      (e) => e.role === 'assistant' && e.requestId === exchange.value.requestId,
    );
  });

  const promptContextPercent = computed(() => {
    const assistant = assistantForPrompt.value;
    if (!assistant || assistant.status !== 'done') return null;
    const conversation = conversationStore.getConversation(
      conversationStore.activeConversationId ?? '',
    );
    if (!conversation) return null;
    return calcPromptContextPercentage(
      conversation.exchanges,
      assistant,
      conversation.numCtx ?? '',
    );
  });

  return { promptContextPercent };
}

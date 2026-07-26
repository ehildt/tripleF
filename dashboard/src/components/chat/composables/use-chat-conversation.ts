import { computed } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useModelsStore } from '../../../stores/models';

/**
 * Maps the active conversation and its selected model into the reactive
 * values the chat orchestrator needs for the exchange list, the prompt
 * action bar, and the right-side panel.
 */
export function useChatConversation() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();

  const conversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );

  const conversation = computed(
    () => conversationStore.getConversation(conversationId.value) ?? null,
  );

  const selectedModelObj = computed(() => {
    const name = conversation.value?.model;
    if (!name) return null;
    return modelsStore.getModel(name) ?? null;
  });

  const userExchanges = computed(() => {
    if (!conversation.value) return [];
    return conversation.value.exchanges.filter((ex) => ex.role === 'user');
  });

  /** Explicit conversation numCtx, else the model's default context size. */
  const effectiveNumCtx = computed(() => {
    if (conversation.value?.numCtx) return conversation.value.numCtx;
    const options = modelsStore.numCtxOptions.map(String);
    const ctx = selectedModelObj.value?.context_length;
    const filtered = ctx
      ? options.filter((opt) => Number(opt) <= ctx)
      : options;
    return filtered.at(-1) ?? '';
  });

  const messageListItems = computed(() =>
    userExchanges.value.map((ex) => {
      const assistant = conversation.value?.exchanges.find(
        (e) => e.role === 'assistant' && e.requestId === ex.requestId,
      );
      const ctx = Number(effectiveNumCtx.value);
      const hasTokenData =
        assistant != null &&
        (assistant.inputTokenDelta != null || assistant.evalCount != null);
      const percent =
        assistant && ctx && hasTokenData
          ? Math.min(
              100,
              (((assistant.inputTokenDelta ?? 0) + (assistant.evalCount ?? 0)) /
                ctx) *
                100,
            ).toFixed(2)
          : null;
      return {
        role: ex.role,
        content: ex.content,
        included: ex.included !== false,
        contextPercent: percent ?? '--',
      };
    }),
  );

  /** Include/exclude the user prompt at the given history index (pairs its
   * assistant response automatically). */
  function toggleUserExchangeIncluded(index: number) {
    const exchange = userExchanges.value[index];
    if (!conversation.value || !exchange) return;
    conversationStore.toggleExchangeIncluded(
      conversation.value.id,
      exchange.id,
    );
  }

  /** Delete the user prompt at the given history index (pairs its
   * assistant response automatically). */
  function deleteUserExchange(index: number) {
    const exchange = userExchanges.value[index];
    if (!conversation.value || !exchange) return;
    conversationStore.deleteExchangeAndPrune(
      conversation.value.id,
      exchange.id,
    );
  }

  return {
    conversationId,
    conversation,
    selectedModelObj,
    userExchanges,
    messageListItems,
    toggleUserExchangeIncluded,
    deleteUserExchange,
  };
}

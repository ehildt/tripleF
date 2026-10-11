import { computed } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';

import { useSelectedModel } from './use-selected-model';

/**
 * The context-size (numCtx) selector for the toolbar's conversation menu:
 * the model-clamped option list, the active conversation's value, the
 * default, and the selection action (which clamps silently to the model's
 * context window). Derives from the conversation and models stores.
 */
export function useContextSize() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const { selectedModelDetails } = useSelectedModel();

  const activeConversationId = computed(
    () => conversationStore.activeConversationId ?? '',
  );

  const activeConversation = computed(
    () => conversationStore.getConversation(activeConversationId.value) ?? null,
  );

  const allNumCtxOptions = computed(() =>
    modelsStore.numCtxOptions.map(String),
  );

  const contextOptions = computed(() => {
    if (modelsStore.modelsLoading) return [];
    const contextLength = selectedModelDetails.value?.context_length;
    if (!contextLength) return allNumCtxOptions.value;
    return allNumCtxOptions.value.filter(
      (option) => Number(option) <= contextLength,
    );
  });

  const currentNumCtx = computed(() => activeConversation.value?.numCtx || '');

  const defaultNumCtx = computed(
    () => contextOptions.value.at(-1) || modelsStore.defaultNumCtx || '',
  );

  function selectNumCtx(ctx: string) {
    let sid = activeConversationId.value;
    if (!sid) {
      const conversation = conversationStore.ensureConversation();
      sid = conversation.id;
    }
    const maxCtx = selectedModelDetails.value?.context_length;
    if (maxCtx && Number(ctx) > maxCtx) ctx = String(maxCtx);
    conversationStore.setNumCtx(sid, ctx);
  }

  return {
    contextOptions,
    currentNumCtx,
    defaultNumCtx,
    selectNumCtx,
  };
}

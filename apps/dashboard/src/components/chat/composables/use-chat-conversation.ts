import { computed } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useModelsStore } from '../../../stores/models';

/**
 * Maps the active conversation and its selected model into the reactive
 * values the chat orchestrator needs for the exchange list and the prompt
 * action bar.
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
    // Prefer the conversation's model, but fall back to the globally
    // selected model so the context-size options stay clamped to the
    // model's supported numctx even before a conversation exists.
    const name = conversation.value?.model || modelsStore.selectedModel;
    if (!name) return null;
    return modelsStore.getModel(name) ?? null;
  });

  return {
    conversationId,
    conversation,
    selectedModelObj,
  };
}

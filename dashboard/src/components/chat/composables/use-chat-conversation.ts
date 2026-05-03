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

  const messageListItems = computed(() =>
    userExchanges.value.map((ex) => ({ role: ex.role, content: ex.content })),
  );

  return {
    conversationId,
    conversation,
    selectedModelObj,
    userExchanges,
    messageListItems,
  };
}

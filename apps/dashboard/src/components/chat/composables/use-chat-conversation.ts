import { computed } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useModelsStore } from '../../../stores/models';
import { useMergeSelection } from '../exchange-list/composables/use-merge-selection';
import { mapExchangeToListItem } from './helpers/map-exchange-to-list-item.helper';
import { useBranchExchange } from './use-branch-exchange';

/**
 * Maps the active conversation and its selected model into the reactive
 * values the chat orchestrator needs for the exchange list, the prompt
 * action bar, and the right-side panel.
 */
export function useChatConversation() {
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const { branchExchange } = useBranchExchange();
  const mergeSelection = useMergeSelection();

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
    userExchanges.value.map((ex) =>
      mapExchangeToListItem(
        ex,
        conversation.value,
        effectiveNumCtx.value,
        mergeSelection,
      ),
    ),
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

  /** Merge availability for the active conversation: icons gray out with
   * fewer than two completed user prompts. */
  const canMerge = computed(() =>
    conversation.value
      ? mergeSelection.hasMergeCandidates(conversation.value.id)
      : false,
  );

  /** Merge armed when at least two user prompts are selected: icons pulse. */
  const mergeArmed = computed(() =>
    conversation.value
      ? mergeSelection.isMergeArmed(conversation.value.id)
      : false,
  );

  /** Select/deselect the user prompt at the given history index for a
   * merge (pairs its assistant response automatically). */
  function toggleUserExchangeMerge(index: number) {
    const exchange = userExchanges.value[index];
    if (!conversation.value || !exchange) return;
    mergeSelection.toggleMergeSelection(conversation.value.id, exchange.id);
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

  /** Branch the conversation at the user prompt with the given history
   * index: the prompt (and its reply) seed a new conversation. */
  function branchUserExchange(index: number) {
    const exchange = userExchanges.value[index];
    if (!exchange) return;
    branchExchange(exchange.id);
  }

  return {
    conversationId,
    conversation,
    selectedModelObj,
    userExchanges,
    messageListItems,
    toggleUserExchangeIncluded,
    toggleUserExchangeMerge,
    canMerge,
    mergeArmed,
    deleteUserExchange,
    branchUserExchange,
  };
}

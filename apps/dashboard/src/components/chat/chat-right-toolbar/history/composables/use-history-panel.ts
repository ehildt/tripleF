import { useClipboard } from '@vueuse/core';
import { computed } from 'vue';

import { useBranchExchange } from '@/components/chat/composables/use-branch-exchange';
import { useChatConversation } from '@/components/chat/composables/use-chat-conversation';
import { useMergeSelection } from '@/components/chat/shared/composables/use-merge-selection';
import { useChatViewStore } from '@/stores/chat-view';
import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';

import { mapExchangeToListItem } from '../helpers/map-exchange-to-list-item.helper';

/**
 * View-model for the chat right toolbar's history section: the mapped history
 * rows, the active-exchange highlight, merge availability, and the per-row
 * actions (jump to the prompt's section, copy, include, merge, delete, branch).
 *
 * The History panel reads this composable instead of receiving history data
 * as props, so the toolbar parent stays a plain shell over its three
 * self-contained section children.
 */
export function useHistoryPanel() {
  const chatViewStore = useChatViewStore();
  const conversationStore = useConversationStore();
  const modelsStore = useModelsStore();
  const { branchExchange } = useBranchExchange();
  const mergeSelection = useMergeSelection();

  const { conversation, selectedModelObj } = useChatConversation();

  const userExchanges = computed(() => {
    if (!conversation.value) return [];
    return conversation.value.exchanges.filter((ex) => ex.role === 'user');
  });

  /** Whether the history section has content (and thus shows its tab). */
  const hasHistory = computed(() => userExchanges.value.length > 0);

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

  const messageListItems = computed(() => {
    // Index assistant replies by requestId once per remap so each user row
    // resolves its paired reply in O(1) instead of scanning all exchanges.
    const assistantByRequestId = new Map<string, Exchange>();
    for (const exchange of conversation.value?.exchanges ?? []) {
      if (exchange.role === 'assistant' && exchange.requestId) {
        assistantByRequestId.set(exchange.requestId, exchange);
      }
    }
    return userExchanges.value.map((ex) =>
      mapExchangeToListItem(
        ex,
        conversation.value?.id ?? null,
        effectiveNumCtx.value,
        assistantByRequestId,
        mergeSelection,
      ),
    );
  });

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

  const activeUserExchangeId = computed(
    () => chatViewStore.activeUserExchangeId,
  );

  const { copy } = useClipboard({ legacy: true });

  /** Clicking a row jumps the exchange list to that prompt's section. */
  function onPromptClick(index: number) {
    const id = userExchanges.value[index]?.id;
    if (id) chatViewStore.requestScrollToExchange(id);
  }

  /** Copying a row copies its rendered message content. */
  function onCopy(index: number) {
    const content = messageListItems.value[index]?.content;
    if (content) copy(content);
  }

  return {
    messageListItems,
    hasHistory,
    activeUserExchangeId,
    canMerge,
    mergeArmed,
    onPromptClick,
    onCopy,
    toggleUserExchangeIncluded,
    toggleUserExchangeMerge,
    deleteUserExchange,
    branchUserExchange,
  };
}

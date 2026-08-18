import {
  clearMergeSelection as clearMergeSelectionState,
  mergeSelectedIdsByConversation,
  setMergeSelectedIds,
} from '@/composables/merge-selection.state';
import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import { getPairedExchangeIds } from '../helpers/get-paired-exchange-ids.helper';
import type { UseMergeSelection } from './use-merge-selection.types';

export function useMergeSelection(): UseMergeSelection {
  const conversationStore = useConversationStore();

  function selectedExchangeIds(conversationId: string): string[] {
    return mergeSelectedIdsByConversation.value[conversationId] ?? [];
  }

  function isMergeSelected(
    conversationId: string,
    exchangeId: string,
  ): boolean {
    return selectedExchangeIds(conversationId).includes(exchangeId);
  }

  function toggleMergeSelection(
    conversationId: string,
    exchangeId: string,
  ): void {
    const conversation = conversationStore.getConversation(conversationId);
    if (!conversation) return;

    const pair = getPairedExchangeIds(conversation.exchanges, exchangeId);
    if (!pair) return;

    const next = new Set(selectedExchangeIds(conversationId));
    const anySelected = pair.some((id) => next.has(id));
    for (const id of pair) {
      if (anySelected) next.delete(id);
      else next.add(id);
    }
    setMergeSelectedIds(conversationId, [...next]);
  }

  function clearMergeSelection(conversationId: string): void {
    clearMergeSelectionState(conversationId);
  }

  function hasMergeCandidates(conversationId: string): boolean {
    const conversation = conversationStore.getConversation(conversationId);
    if (!conversation) return false;
    // Plain-excluded exchanges cannot be merged (the user must include them
    // first), but merged-away ones stay selectable — only truly excluded
    // items are dropped from the candidate count.
    return (
      conversation.exchanges.filter(
        (exchange) =>
          exchange.role === 'user' &&
          exchange.status === 'done' &&
          (exchange.included !== false || exchange.mergedInto != null),
      ).length >= 2
    );
  }

  function isMergeArmed(conversationId: string): boolean {
    return selectedRequestIds(conversationId).length >= 2;
  }

  function selectedExchanges(conversationId: string): Exchange[] {
    const conversation = conversationStore.getConversation(conversationId);
    if (!conversation) return [];
    const ids = new Set(selectedExchangeIds(conversationId));
    return conversation.exchanges.filter((exchange) => ids.has(exchange.id));
  }

  function selectedRequestIds(conversationId: string): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const exchange of selectedExchanges(conversationId)) {
      if (exchange.role !== 'user' || !exchange.requestId) continue;
      if (seen.has(exchange.requestId)) continue;
      seen.add(exchange.requestId);
      result.push(exchange.requestId);
    }
    return result;
  }

  return {
    isMergeSelected,
    toggleMergeSelection,
    clearMergeSelection,
    hasMergeCandidates,
    isMergeArmed,
    selectedExchangeIds,
    selectedExchanges,
    selectedRequestIds,
  };
}

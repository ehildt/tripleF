import { defineStore } from 'pinia';
import { ref } from 'vue';

/** Per-conversation merge selection and pending-request data for Chat. */
export const useMergeSelectionStore = defineStore('merge-selection', () => {
  const mergeSelectedIdsByConversation = ref<Record<string, string[]>>({});
  const pendingMergeRequestByConversation = ref<Record<string, string>>({});

  /** Read selected ids, or compare membership when an exchange id is given. */
  function getMergeSelectedIds(conversationId: string): string[];
  function getMergeSelectedIds(
    conversationId: string,
    exchangeId: string,
  ): boolean;
  function getMergeSelectedIds(
    conversationId: string,
    exchangeId?: string,
  ): string[] | boolean {
    const ids = mergeSelectedIdsByConversation.value[conversationId] ?? [];
    return exchangeId === undefined ? ids : ids.includes(exchangeId);
  }

  /** Read a pending request id, or compare it when an expected id is given. */
  function getPendingMergeRequest(conversationId: string): string | undefined;
  function getPendingMergeRequest(
    conversationId: string,
    expectedRequestId: string,
  ): boolean;
  function getPendingMergeRequest(
    conversationId: string,
    expectedRequestId?: string,
  ): string | boolean | undefined {
    const requestId = pendingMergeRequestByConversation.value[conversationId];
    return expectedRequestId === undefined
      ? requestId
      : requestId === expectedRequestId;
  }

  function setMergeSelectedIds(conversationId: string, ids: string[]): void {
    const next = { ...mergeSelectedIdsByConversation.value };
    if (ids.length === 0) delete next[conversationId];
    else next[conversationId] = ids;
    mergeSelectedIdsByConversation.value = next;
  }

  /** Record the request id whose terminal event resolves the merge selection. */
  function markMergePending(conversationId: string, requestId: string): void {
    pendingMergeRequestByConversation.value = {
      ...pendingMergeRequestByConversation.value,
      [conversationId]: requestId,
    };
  }

  /** Resolve only the recorded request and drop its consumed source ids. */
  function resolvePendingMerge(
    conversationId: string,
    requestId: string,
    sourceExchangeIds: string[],
  ): void {
    if (!getPendingMergeRequest(conversationId, requestId)) return;

    const pending = { ...pendingMergeRequestByConversation.value };
    delete pending[conversationId];
    pendingMergeRequestByConversation.value = pending;

    const consumed = new Set(sourceExchangeIds);
    const remaining = getMergeSelectedIds(conversationId).filter(
      (id) => !consumed.has(id),
    );
    setMergeSelectedIds(conversationId, remaining);
  }

  /** Remove deleted exchanges without disturbing other selected pairs. */
  function pruneMergeSelection(
    conversationId: string,
    exchangeIds: string[],
  ): void {
    const selected = getMergeSelectedIds(conversationId);
    if (selected.length === 0 || exchangeIds.length === 0) return;
    const removed = new Set(exchangeIds);
    const remaining = selected.filter((id) => !removed.has(id));
    if (remaining.length !== selected.length)
      setMergeSelectedIds(conversationId, remaining);
  }

  /** Drop all merge selection and any pending merge of the conversation. */
  function clearMergeSelection(conversationId: string): void {
    setMergeSelectedIds(conversationId, []);
    if (getPendingMergeRequest(conversationId) === undefined) return;
    const pending = { ...pendingMergeRequestByConversation.value };
    delete pending[conversationId];
    pendingMergeRequestByConversation.value = pending;
  }

  return {
    mergeSelectedIdsByConversation,
    pendingMergeRequestByConversation,
    getMergeSelectedIds,
    getPendingMergeRequest,
    setMergeSelectedIds,
    markMergePending,
    resolvePendingMerge,
    pruneMergeSelection,
    clearMergeSelection,
  };
});

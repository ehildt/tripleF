import { ref } from 'vue';

/**
 * Module-scoped merge selection for the chat exchange list: which exchanges
 * the user has picked to consolidate into one unified response. Keyed by
 * conversation id so switching conversations never leaks a stale selection.
 *
 * The merge lifecycle has two states:
 * - armed: 2+ exchanges selected, the picked icons pulse to signal readiness.
 * - pending: a merge submit is in flight. The selection is intentionally kept
 *   so the source icons keep pulsing until the model has delivered the merged
 *   response. Only then are the sources marked as merged (purple/excluded)
 *   and the selection resolves into the consumed state. A failed request
 *   resolves the selection too, but leaves the sources untouched so the user
 *   can re-select and retry.
 */
export const mergeSelectedIdsByConversation = ref<Record<string, string[]>>({});

/** conversationId → requestId of the in-flight merged request. */
export const pendingMergeRequestByConversation = ref<Record<string, string>>(
  {},
);

export function setMergeSelectedIds(
  conversationId: string,
  ids: string[],
): void {
  const next = { ...mergeSelectedIdsByConversation.value };
  if (ids.length === 0) delete next[conversationId];
  else next[conversationId] = ids;
  mergeSelectedIdsByConversation.value = next;
}

/**
 * Resolve an in-flight merge for a conversation: stop the pulse and drop the
 * consumed source exchanges from the selection. Only resolves when the given
 * requestId is the recorded pending merge, so unrelated requests never touch
 * an in-flight merge. Called from the conversation store when the merged
 * request reaches a terminal state (done or error).
 */
export function resolvePendingMerge(
  conversationId: string,
  requestId: string,
  sourceExchangeIds: string[],
): void {
  if (pendingMergeRequestByConversation.value[conversationId] !== requestId) {
    return;
  }
  const pending = { ...pendingMergeRequestByConversation.value };
  delete pending[conversationId];
  pendingMergeRequestByConversation.value = pending;

  const consumed = new Set(sourceExchangeIds);
  const remaining = (
    mergeSelectedIdsByConversation.value[conversationId] ?? []
  ).filter((id) => !consumed.has(id));
  setMergeSelectedIds(conversationId, remaining);
}

/** Record the request id of a just-submitted merge so the selection keeps
 * pulsing until the merged response arrives. */
export function markMergePending(
  conversationId: string,
  requestId: string,
): void {
  pendingMergeRequestByConversation.value = {
    ...pendingMergeRequestByConversation.value,
    [conversationId]: requestId,
  };
}

/** Drop all merge selection and any pending merge of the conversation. */
export function clearMergeSelection(conversationId: string): void {
  setMergeSelectedIds(conversationId, []);
  if (!(conversationId in pendingMergeRequestByConversation.value)) return;
  const pending = { ...pendingMergeRequestByConversation.value };
  delete pending[conversationId];
  pendingMergeRequestByConversation.value = pending;
}

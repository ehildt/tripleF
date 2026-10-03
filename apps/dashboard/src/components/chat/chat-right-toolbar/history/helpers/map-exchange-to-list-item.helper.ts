import type { Exchange } from '@/stores/conversation';

import type { HistoryListItemData } from '../history-list/HistoryList.types';

/** The narrow slice of the merge-selection service the mapper reads from. */
type MergeSelectionQuery = {
  isMergeSelected: (conversationId: string, exchangeId: string) => boolean;
};

/**
 * Map one user exchange into the history list-item shape. The paired
 * assistant reply is resolved from a prebuilt requestId index (built once per
 * list remap by the caller) so mapping N rows stays O(n) instead of scanning
 * every exchange for each row.
 */
export function mapExchangeToListItem(
  ex: Exchange,
  conversationId: string | null,
  effectiveNumCtx: string,
  assistantByRequestId: ReadonlyMap<string, Exchange> | null,
  mergeSelection: MergeSelectionQuery,
): HistoryListItemData {
  const assistant = ex.requestId
    ? assistantByRequestId?.get(ex.requestId)
    : undefined;
  const ctx = Number(effectiveNumCtx);
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
    id: ex.id,
    role: ex.role,
    content: ex.content,
    included: ex.included !== false,
    mergeSelected: conversationId
      ? mergeSelection.isMergeSelected(conversationId, ex.id)
      : false,
    merged: ex.mergedInto != null,
    mergedRequestId: ex.mergedInto ?? undefined,
    // Leave undefined until the turn's token data is available so the
    // history item shows no percentage rather than a misleading "--%".
    contextPercent: percent ?? undefined,
  };
}

import type { Conversation, Exchange } from '@/stores/conversation';

/** Map one user exchange into the history list-item shape. */
export function mapExchangeToListItem(
  ex: Exchange,
  conversation: Conversation | null,
  effectiveNumCtx: string,
  mergeSelection: {
    isMergeSelected: (conversationId: string, exchangeId: string) => boolean;
  },
) {
  const assistant = conversation?.exchanges.find(
    (e) => e.role === 'assistant' && e.requestId === ex.requestId,
  );
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
    mergeSelected: conversation
      ? mergeSelection.isMergeSelected(conversation.id, ex.id)
      : false,
    merged: ex.mergedInto != null,
    mergedRequestId: ex.mergedInto ?? undefined,
    // Leave undefined until the turn's token data is available so the
    // history item shows no percentage rather than a misleading "--%".
    contextPercent: percent ?? undefined,
  };
}

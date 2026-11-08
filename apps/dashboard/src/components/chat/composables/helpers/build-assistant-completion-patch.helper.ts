import type { Exchange } from '@/stores/chat/conversation/conversation.model';
import { calcInputTokenDelta } from '@/stores/chat/conversation/helpers/calc-input-token-delta.helper';

import type { AssistantCompletionTokenData } from './build-assistant-completion-patch.helper.types';

/** Build terminal assistant fields, calculating tokens as if status were done. */
export function buildAssistantCompletionPatch(
  exchanges: Exchange[],
  requestId: string,
  tokenData?: AssistantCompletionTokenData,
): Partial<Exchange> {
  const patch: Partial<Exchange> = { status: 'done' };
  if (!tokenData) return patch;

  patch.promptEvalCount = tokenData.promptEvalCount;
  patch.evalCount = tokenData.evalCount;
  if (tokenData.promptEvalCount != null) {
    let targetPatched = false;
    const completedExchanges = exchanges.map((exchange) => {
      if (
        targetPatched ||
        exchange.requestId !== requestId ||
        exchange.role !== 'assistant'
      ) {
        return exchange;
      }
      targetPatched = true;
      return { ...exchange, ...patch };
    });
    patch.inputTokenDelta = calcInputTokenDelta(
      completedExchanges,
      tokenData.promptEvalCount,
    );
  }
  return patch;
}

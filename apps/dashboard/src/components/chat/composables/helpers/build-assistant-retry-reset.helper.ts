import type { Exchange } from '@/stores/chat/conversation/conversation.model';

/** Build the clean pending assistant state used when a request is retried. */
export function buildAssistantRetryReset(
  metadata: Pick<Exchange, 'model' | 'event' | 'roomId'>,
  serverConversationId: string,
): Partial<Exchange> {
  return {
    content: '',
    status: 'pending',
    ...metadata,
    conversationId: serverConversationId,
    promptEvalCount: undefined,
    evalCount: undefined,
    inputTokenDelta: undefined,
    toolCalls: undefined,
    activity: undefined,
    activityLanguage: undefined,
    reasoning: undefined,
    responseTemplate: undefined,
    responseData: undefined,
    text: undefined,
    chartData: undefined,
    revealCharts: undefined,
  };
}

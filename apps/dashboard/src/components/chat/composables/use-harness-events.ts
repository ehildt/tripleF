import { useChatResponseActivity } from '@/components/app/composables/use-chat-response-activity';
import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationExchangeCompletion } from '@/components/chat/composables/use-conversation-exchange-completion';
import { useConversationExchanges } from '@/components/chat/composables/use-conversation-exchanges';
import { useConversationImages } from '@/components/chat/composables/use-conversation-images';
import { useHarnessResponseStreams } from '@/components/chat/composables/use-harness-response-streams';
import type { AssistantResponseState } from '@/components/chat/shared/helpers/assistant-response/response-state/create-assistant-response-state.helper.types';
import { parseSocketEvent } from '@/composables/helpers/parse-socket-event.helper';
import { useToast } from '@/composables/use-toast/use-toast';
import type {
  Conversation,
  Exchange,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useModelsStore } from '@/stores/models/models.store';
import type { AssistantActivityDescriptor } from '@/types/activity.model';
import type {
  AssistantActivityData,
  AssistantChartData,
  AssistantCompletedData,
  AssistantDeltaData,
  AssistantFailedData,
  AssistantToolCallData,
} from '@/types/assistant-socket-event.model';
import type {
  AssistantStreamEvent,
  AssistantToolCall,
} from '@/types/assistant-stream-event.model';
import type { SocketEvent } from '@/types/socket-event.model';

import { extractUploadedImagesFromResponse } from './helpers/extract-uploaded-images-from-response.helper';

/**
 * Structured activity descriptor shown while the model streams response data:
 * the thinking phase is over, the response is being assembled token by token.
 * Localized by the client in the model's response language.
 */
const STREAMING_ACTIVITY: AssistantActivityDescriptor = {
  key: 'activity.assembling',
};

interface HarnessEvents {
  handleHarnessEvent: (eventName: string, data: unknown) => void;
}

function findAssistantExchange(
  conversation: Conversation,
  requestId: string,
): Exchange | undefined {
  return conversation.exchanges.find(
    (exchange) =>
      exchange.requestId === requestId && exchange.role === 'assistant',
  );
}

function isTerminalAssistantExchange(exchange: Exchange | undefined): boolean {
  return exchange?.status === 'done' || exchange?.status === 'error';
}

/** Own harness envelope reduction and its conversation/stream side effects. */
export function useHarnessEvents(): HarnessEvents {
  const conversationStore = useConversationStore();
  const { notifyChatResponse } = useChatResponseActivity();
  const configuration = useConversationConfiguration();
  const exchanges = useConversationExchanges();
  const completion = useConversationExchangeCompletion();
  const images = useConversationImages();
  const responseStreams = useHarnessResponseStreams();

  /** Conversations subscribed to the emitting channel. */
  function targetConversations(eventName: string): Conversation[] {
    return conversationStore.conversations.filter(
      (conversation) => !conversation.event || conversation.event === eventName,
    );
  }

  function forEachAssistantExchange(
    eventName: string,
    requestId: string,
    mutate: (exchange: Exchange, conversation: Conversation) => void,
  ): void {
    for (const conversation of targetConversations(eventName)) {
      const exchange = findAssistantExchange(conversation, requestId);
      if (!exchange) continue;
      const draft = { ...exchange };
      mutate(draft, conversation);
      conversationStore.patchAssistantExchange(
        conversation.id,
        requestId,
        draft,
      );
    }
  }

  /** Find the assistant exchange, creating a pending placeholder if absent. */
  function ensureAssistantExchange(
    conversation: Conversation,
    requestId: string,
  ): Exchange | undefined {
    const existing = findAssistantExchange(conversation, requestId);
    if (existing) return existing;
    void exchanges.addExchange(conversation.id, {
      role: 'assistant',
      content: '',
      requestId,
      status: 'pending',
    });
    return findAssistantExchange(conversation, requestId);
  }

  /** Reflect in-flight pipeline state into a streaming assistant exchange. */
  function applyStreamingState(
    exchange: Exchange,
    state: AssistantResponseState,
    language: string | undefined,
  ): void {
    const fallback = state.text || state.lastValidData?.title || '';
    exchange.content = fallback;
    exchange.status = 'streaming';
    exchange.responseTemplate = state.template ?? undefined;
    exchange.responseData = state.lastValidData ?? undefined;
    exchange.text = state.text || undefined;
    exchange.chartData = state.chartData;
    exchange.revealCharts = state.revealCharts;
    exchange.reasoning = undefined;
    // A real content delta ends the tool phase: the model is now assembling.
    exchange.toolCalls = undefined;
    exchange.activity = STREAMING_ACTIVITY;
    if (language) exchange.activityLanguage = language;
  }

  /** Finalize the assistant exchange from the authoritative completed payload. */
  function finalizeAssistantExchange(
    exchange: Exchange,
    state: AssistantResponseState,
    data: AssistantCompletedData,
  ): void {
    const content =
      state.text || state.lastValidData?.title || data.result || '';
    exchange.content = content;
    exchange.status = 'done';
    exchange.responseTemplate = data.template ?? state.template ?? undefined;
    exchange.responseData =
      state.lastValidData ??
      (data.data as Exchange['responseData'] | undefined);
    exchange.text = state.text || undefined;
    exchange.chartData = state.chartData;
    exchange.revealCharts = state.revealCharts;
    exchange.reasoning = undefined;
    exchange.activity = undefined;
    exchange.activityLanguage = undefined;
    exchange.toolCalls = undefined;
  }

  /** Seed a user exchange for cross-device/session continuation. */
  function seedUserExchange(
    conversation: Conversation,
    requestId: string,
    eventName: string,
    prompt: string | undefined,
  ): void {
    if (!prompt) return;
    const exists = conversation.exchanges.some(
      (exchange) =>
        exchange.role === 'user' && exchange.requestId === requestId,
    );
    if (exists) return;
    void exchanges.addExchange(conversation.id, {
      role: 'user',
      content: prompt,
      requestId,
      status: 'done',
      event: eventName,
    });
  }

  function ensureConversationNumCtx(conversation: Conversation): void {
    const modelsStore = useModelsStore();
    if (conversation.numCtx || !conversation.model) return;
    const numCtx = modelsStore.maxNumCtxForModel(conversation.model);
    if (numCtx) {
      // Keep the sidebar/context percentage consistent after a reload.
      void configuration.setNumCtx(conversation.id, numCtx);
    }
  }

  function handleActivity(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const { key, language } = envelope.data as AssistantActivityData;
    if (!key) return;
    forEachAssistantExchange(eventName, requestId, (exchange) => {
      exchange.activity = { key };
      if (language) exchange.activityLanguage = language;
    });
    notifyChatResponse();
  }

  function handleToolCall(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const toolCall = envelope.data as AssistantToolCallData;
    if (!toolCall.name) return;
    for (const conversation of targetConversations(eventName)) {
      const exchange = ensureAssistantExchange(conversation, requestId);
      if (!exchange) continue;

      // Parallel searches with different queries are distinct active calls.
      const toolKey = (call: AssistantToolCall): string =>
        `${call.name}\u0000${call.query ?? ''}`;
      const draft = { ...exchange };
      const active = (draft.toolCalls ?? []).filter(
        (call) => toolKey(call) !== toolKey(toolCall),
      );
      if (toolCall.language) draft.activityLanguage = toolCall.language;

      if (toolCall.status === 'done' || toolCall.status === 'error') {
        draft.toolCalls = active.length ? active : undefined;
      } else {
        draft.toolCalls = [
          ...active,
          {
            name: toolCall.name,
            category: toolCall.category,
            query: toolCall.query,
            status: toolCall.status ?? 'start',
          },
        ];
      }
      conversationStore.patchAssistantExchange(
        conversation.id,
        requestId,
        draft,
      );
    }
    notifyChatResponse();
  }

  function handleDelta(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const { channel, text, template, language, images } =
      envelope.data as AssistantDeltaData;

    if (channel === 'reasoning') {
      forEachAssistantExchange(eventName, requestId, (exchange) => {
        exchange.reasoning = (exchange.reasoning ?? '') + (text ?? '');
        if (language) exchange.activityLanguage = language;
      });
      notifyChatResponse();
      return;
    }

    const streamEvent: AssistantStreamEvent = {
      requestId,
      template,
      delta: text,
      language,
      images,
      done: false,
    };
    const state = responseStreams.processHarnessStreamEvent(
      requestId,
      streamEvent,
    );

    for (const conversation of targetConversations(eventName)) {
      const exchange = ensureAssistantExchange(conversation, requestId);
      if (!exchange) continue;
      const draft = { ...exchange };
      applyStreamingState(draft, state, language);
      conversationStore.patchAssistantExchange(
        conversation.id,
        requestId,
        draft,
        true,
      );
    }
    notifyChatResponse();
  }

  function handleChart(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const { toolName, data, template } = envelope.data as AssistantChartData;
    const state = responseStreams.processHarnessStreamEvent(requestId, {
      requestId,
      template,
      chartData: { toolName, data },
      done: false,
    });

    for (const conversation of targetConversations(eventName)) {
      const exchange = ensureAssistantExchange(conversation, requestId);
      if (!exchange) continue;
      conversationStore.patchAssistantExchange(
        conversation.id,
        requestId,
        {
          chartData: state.chartData,
          revealCharts: state.revealCharts,
        },
        true,
      );
    }
    notifyChatResponse();
  }

  function handleCompleted(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const data = envelope.data as AssistantCompletedData;
    if (!data) return;

    const targeted = targetConversations(eventName);
    const conversations = targeted.filter(
      (conversation) =>
        !isTerminalAssistantExchange(
          findAssistantExchange(conversation, requestId),
        ),
    );

    // A repeated completion must not rebuild state after terminal cleanup and
    // erase text that arrived through earlier deltas. New/unknown targets are
    // still accepted, while already terminal exchanges remain authoritative.
    if (targeted.length > 0 && conversations.length === 0) {
      responseStreams.resetHarnessResponseStream(requestId);
      notifyChatResponse();
      return;
    }

    const streamEvent: AssistantStreamEvent = {
      requestId,
      template: data.template,
      delta: data.result ?? '',
      data: data.data,
      images: data.images,
      toolResults: data.toolResults,
      done: true,
    };
    const state = responseStreams.processHarnessStreamEvent(
      requestId,
      streamEvent,
    );

    for (const conversation of conversations) {
      seedUserExchange(conversation, requestId, eventName, data.prompt);
      const exchange = ensureAssistantExchange(conversation, requestId);
      if (!exchange) continue;
      const draft = { ...exchange };
      finalizeAssistantExchange(draft, state, data);
      conversationStore.patchAssistantExchange(
        conversation.id,
        requestId,
        draft,
        true,
      );
      void completion.markExchangeDone(conversation.id, requestId, {
        promptEvalCount: data.usage?.promptEvalCount,
        evalCount: data.usage?.evalCount,
      });

      ensureConversationNumCtx(conversation);

      const uploadedImages = extractUploadedImagesFromResponse(
        data.meta,
        conversationStore.getConversationId(conversation.id),
        Date.now(),
      );
      if (uploadedImages.length > 0) {
        void images.setUploadedImages(conversation.id, uploadedImages);
      }
    }
    responseStreams.resetHarnessResponseStream(requestId);
    notifyChatResponse();
  }

  function handleFailed(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const reason =
      (envelope.data as AssistantFailedData)?.reason ??
      'An unexpected error occurred';
    // Preserve the provider's actionable failure text and existing status path.
    useToast().error(String(reason));
    for (const conversation of targetConversations(eventName)) {
      const exchange = ensureAssistantExchange(conversation, requestId);
      if (!exchange) continue;
      conversationStore.patchAssistantExchange(
        conversation.id,
        requestId,
        {
          content: `Error: ${reason}`,
          activity: undefined,
          reasoning: undefined,
          toolCalls: undefined,
        },
        true,
      );
      void completion.markExchangeDone(conversation.id, requestId);
      ensureConversationNumCtx(conversation);
    }
    responseStreams.resetHarnessResponseStream(requestId);
    notifyChatResponse();
  }

  function handleCancelled(requestId: string): void {
    let cancelled = false;
    for (const conversation of conversationStore.conversations) {
      if (!findAssistantExchange(conversation, requestId)) continue;
      cancelled = true;
      void completion.markExchangeCancelled(conversation.id, requestId);
    }
    responseStreams.resetHarnessResponseStream(requestId);
    if (cancelled) notifyChatResponse();
  }

  /** Route one parsed v1 envelope by its type and request correlation id. */
  function handleHarnessEvent(eventName: string, data: unknown): void {
    const envelope = parseSocketEvent(data);
    if (!envelope) return;
    const requestId = envelope.meta?.requestId;
    if (!requestId) return;

    switch (envelope.type) {
      case 'harness:activity':
        handleActivity(eventName, requestId, envelope);
        break;
      case 'harness:tool-call':
        handleToolCall(eventName, requestId, envelope);
        break;
      case 'harness:delta':
        handleDelta(eventName, requestId, envelope);
        break;
      case 'harness:chart':
        handleChart(eventName, requestId, envelope);
        break;
      case 'harness:completed':
        handleCompleted(eventName, requestId, envelope);
        break;
      case 'harness:failed':
        handleFailed(eventName, requestId, envelope);
        break;
      case 'harness:cancelled':
        handleCancelled(requestId);
        break;
      default:
        break;
    }
  }

  return { handleHarnessEvent };
}

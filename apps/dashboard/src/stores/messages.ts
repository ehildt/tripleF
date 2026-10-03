import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { parseSocketEvent } from '@/composables/helpers/parse-socket-event.helper';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { type Exchange, useConversationStore } from '@/stores/conversation';
import { createHarnessResponseState } from '@/stores/helpers/harness/state/create-harness-response-state.helper';
import type { HarnessResponseState } from '@/stores/helpers/harness/state/create-harness-response-state.helper.types';
import { processHarnessResponseEvent } from '@/stores/helpers/harness/state/process-harness-response-event.helper';
import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';
import type {
  HarnessActivityData,
  HarnessChartData,
  HarnessCompletedData,
  HarnessDeltaData,
  HarnessFailedData,
  HarnessToolCallData,
} from '@/types/harness-socket-event.model';
import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';
import type { Message } from '@/types/message.model';
import type { MessageData } from '@/types/message-data.model';
import type { SocketEvent } from '@/types/socket-event.model';
import { formatTime } from '@/utils/format-time.helper';

import { useReadTracker } from '../composables/use-read-tracker';
import { useAppStore } from '../stores/app';
import { useModelsStore } from '../stores/models';
import { extractUploadedImagesFromResponse } from './helpers/messages/extract-uploaded-images-from-response.helper';
import type { Conversation } from './conversation.model';

/**
 * Structured activity descriptor shown while the model streams response data:
 * the thinking phase is over, the response is being assembled token by token.
 * Localized by the client in the model's response language.
 */
const STREAMING_ACTIVITY: HarnessActivityDescriptor = {
  key: 'activity.assembling',
};

function findAssistantExchange(
  conversation: Conversation,
  requestId: string,
): Exchange | undefined {
  return conversation.exchanges.find(
    (e) => e.requestId === requestId && e.role === 'assistant',
  );
}

export const useApiMessagesStore = defineStore('apiMessages', () => {
  const messages = ref<Message[]>([]);
  const trackedRequestIds = ref<Set<string>>(new Set());
  const readTracker = useReadTracker('read-api-ids');
  const harnessStreamStates = new Map<string, HarnessResponseState>();
  const appStore = useAppStore();

  function trackRequest(requestId: string) {
    trackedRequestIds.value.add(requestId);
  }

  function getOrCreateHarnessStreamState(
    requestId: string,
  ): HarnessResponseState {
    let state = harnessStreamStates.get(requestId);
    if (!state) {
      state = createHarnessResponseState(requestId);
      harnessStreamStates.set(requestId, state);
    }
    return state;
  }

  /**
   * Route one parsed v1 envelope by its `type`. The socket channel
   * (`eventName`) identifies the subscribed conversation; `meta.requestId`
   * correlates the turn. Conversation/exchange state is the only target —
   * the raw debug log lives in the socket debug store.
   */
  function addMessage(eventName: string, data: unknown) {
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

  // ── Per-channel conversation targeting ────────────────────────────────
  /** Conversations subscribed to the emitting channel. */
  function targetConversations(eventName: string): Conversation[] {
    return useConversationStore().conversations.filter(
      (conversation) => !conversation.event || conversation.event === eventName,
    );
  }

  function forEachAssistantExchange(
    eventName: string,
    requestId: string,
    mutate: (ex: Exchange, conversation: Conversation) => void,
  ): void {
    for (const conversation of targetConversations(eventName)) {
      const ex = findAssistantExchange(conversation, requestId);
      if (ex) mutate(ex, conversation);
    }
  }

  /** Find the assistant exchange, creating a pending placeholder if absent. */
  function ensureAssistantExchange(
    conversation: Conversation,
    requestId: string,
  ): Exchange | undefined {
    const existing = findAssistantExchange(conversation, requestId);
    if (existing) return existing;
    useConversationStore().addExchange(conversation.id, {
      role: 'assistant',
      content: '',
      requestId,
      status: 'pending',
    });
    return findAssistantExchange(conversation, requestId);
  }

  // ── Phase handlers ─────────────────────────────────────────────────────
  function handleActivity(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const data = envelope.data as HarnessActivityData;
    const { key, language } = data;
    if (!key) return;
    forEachAssistantExchange(eventName, requestId, (ex) => {
      ex.activity = { key };
      if (language) ex.activityLanguage = language;
    });
    trackEnvelopeEntry(eventName, requestId, false);
    appStore.notifyChatResponse();
  }

  function handleToolCall(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const tc = envelope.data as HarnessToolCallData;
    if (!tc.name) return;
    for (const conversation of targetConversations(eventName)) {
      const ex = ensureAssistantExchange(conversation, requestId);
      if (!ex) continue;

      // Key active calls by (name, query): parallel searches with different
      // queries are each real searches — collapsing by name under-counts.
      const toolKey = (call: { name?: string; query?: string }) =>
        `${call.name ?? ''}${call.query ?? ''}`;
      const active = (ex.toolCalls ?? []).filter(
        (t) => toolKey(t) !== toolKey(tc),
      );
      const language = tc.language;
      if (language) ex.activityLanguage = language;

      if (tc.status === 'done' || tc.status === 'error') {
        ex.toolCalls = active.length ? active : undefined;
      } else {
        ex.toolCalls = [
          ...active,
          {
            name: tc.name,
            category: tc.category,
            query: tc.query,
            status: tc.status ?? 'start',
          },
        ];
      }
    }
    trackEnvelopeEntry(eventName, requestId, false);
    appStore.notifyChatResponse();
  }

  function handleDelta(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const { channel, text, template, language, images } =
      envelope.data as HarnessDeltaData;

    if (channel === 'reasoning') {
      forEachAssistantExchange(eventName, requestId, (ex) => {
        ex.reasoning = (ex.reasoning ?? '') + (text ?? '');
        if (language) ex.activityLanguage = language;
      });
      trackEnvelopeEntry(eventName, requestId, false);
      appStore.notifyChatResponse();
      return;
    }

    // Content delta: feed the response-state machine (text vs structured,
    // chart reveal), then reflect it into the assistant exchange.
    const streamEvent: HarnessStreamEvent = {
      requestId,
      template,
      delta: text,
      language,
      images,
      done: false,
    };
    const state = processHarnessResponseEvent(
      getOrCreateHarnessStreamState(requestId),
      streamEvent,
    );
    harnessStreamStates.set(requestId, state);

    for (const conversation of targetConversations(eventName)) {
      const ex = ensureAssistantExchange(conversation, requestId);
      if (!ex) continue;
      applyStreamingState(ex, state, language);
      conversation.updatedAt = Date.now();
    }
    trackEnvelopeEntry(eventName, requestId, false);
    appStore.notifyChatResponse();
  }

  function handleChart(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const { toolName, data, template } = envelope.data as HarnessChartData;
    const state = processHarnessResponseEvent(
      getOrCreateHarnessStreamState(requestId),
      { requestId, template, chartData: { toolName, data }, done: false },
    );
    harnessStreamStates.set(requestId, state);

    for (const conversation of targetConversations(eventName)) {
      const ex = ensureAssistantExchange(conversation, requestId);
      if (!ex) continue;
      ex.chartData = state.chartData;
      ex.revealCharts = state.revealCharts;
      conversation.updatedAt = Date.now();
    }
    trackEnvelopeEntry(eventName, requestId, false);
    appStore.notifyChatResponse();
  }

  function handleCompleted(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const d = envelope.data as HarnessCompletedData;
    if (!d) return;

    // The completed payload is authoritative: the final validated `data`/
    // `result` plus token tallies land here. Feed it through the response
    // pipeline so structural normalization and partial-JSON retry handling
    // stay identical to the streamed path.
    const streamEvent: HarnessStreamEvent = {
      requestId,
      template: d.template,
      delta: d.result ?? '',
      data: d.data,
      images: d.images,
      toolResults: d.toolResults,
      done: true,
    };
    const state = processHarnessResponseEvent(
      getOrCreateHarnessStreamState(requestId),
      streamEvent,
    );
    harnessStreamStates.set(requestId, state);

    const conversationStore = useConversationStore();
    for (const conversation of targetConversations(eventName)) {
      seedUserExchange(conversation, requestId, eventName, d.prompt);
      const ex = ensureAssistantExchange(conversation, requestId);
      if (!ex) continue;
      finalizeAssistantExchange(conversation, ex, state, d);
      conversation.updatedAt = Date.now();

      // Backfill context size once the model is known.
      ensureConversationNumCtx(conversation);

      // Completed responses contribute their media to the conversation
      // gallery for re-use in later turns.
      const uploadedImages = extractUploadedImagesFromResponse(
        { meta: d.meta } as Record<string, unknown>,
        conversationStore.getConversationId(conversation.id),
      );
      if (uploadedImages.length > 0) {
        conversationStore.setUploadedImages(conversation.id, uploadedImages);
      }
    }
    trackEnvelopeEntry(eventName, requestId, true);
    appStore.notifyChatResponse();
  }

  function handleFailed(
    eventName: string,
    requestId: string,
    envelope: SocketEvent,
  ): void {
    const reason =
      (envelope.data as HarnessFailedData)?.reason ??
      'An unexpected error occurred';
    // Terminal error: surface the provider's message as a toast and render it
    // in the exchange — quota/rate-limit rejections carry actionable text.
    useToast().error(String(reason));
    for (const conversation of targetConversations(eventName)) {
      const ex = ensureAssistantExchange(conversation, requestId);
      if (!ex) continue;
      ex.content = `Error: ${reason}`;
      ex.activity = undefined;
      ex.reasoning = undefined;
      ex.toolCalls = undefined;
      conversation.updatedAt = Date.now();
      // Terminal status flows through markExchangeDone (also resolves pending
      // merges) and the context backfill — same as the completed path.
      useConversationStore().markExchangeDone(conversation.id, requestId);
      ensureConversationNumCtx(conversation);
    }
    trackEnvelopeEntry(eventName, requestId, true);
    appStore.notifyChatResponse();
  }

  function handleCancelled(requestId: string): void {
    const conversationStore = useConversationStore();
    for (const conversation of conversationStore.conversations) {
      for (const ex of conversation.exchanges) {
        if (ex.requestId !== requestId || ex.role !== 'assistant') continue;
        ex.status = 'done';
        ex.activity = undefined;
        ex.reasoning = undefined;
      }
    }
  }

  // ── Conversation state transitions ────────────────────────────────────
  /** Seed the user exchange from the completed turn's prompt (fallback for
   *  cross-device/session continuation where client submit seeded nothing). */
  function seedUserExchange(
    conversation: Conversation,
    requestId: string,
    eventName: string,
    prompt: string | undefined,
  ): void {
    if (!prompt) return;
    const conversationStore = useConversationStore();
    const exists = conversation.exchanges.some(
      (e) => e.role === 'user' && e.requestId === requestId,
    );
    if (exists) return;
    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: prompt,
      requestId,
      status: 'done',
      event: eventName,
    });
  }

  /** Reflect in-flight pipeline state into a streaming assistant exchange. */
  function applyStreamingState(
    ex: Exchange,
    state: HarnessResponseState,
    language: string | undefined,
  ): void {
    const fallback = state.text || state.lastValidData?.title || '';
    ex.content = fallback;
    ex.status = 'streaming';
    ex.harnessTemplate = state.template ?? undefined;
    ex.harnessData = state.lastValidData ?? undefined;
    ex.text = state.text || undefined;
    ex.chartData = state.chartData;
    ex.revealCharts = state.revealCharts;
    ex.reasoning = undefined;
    // A real content delta ends the tool phase: the model is now assembling.
    ex.toolCalls = undefined;
    ex.activity = STREAMING_ACTIVITY;
    if (language) ex.activityLanguage = language;
  }

  /** Finalize the assistant exchange from the authoritative completed payload. */
  function finalizeAssistantExchange(
    conversation: Conversation,
    ex: Exchange,
    state: HarnessResponseState,
    d: HarnessCompletedData,
  ): void {
    const content = state.text || state.lastValidData?.title || d.result || '';
    ex.content = content;
    ex.status = 'done';
    ex.harnessTemplate = d.template ?? state.template ?? undefined;
    ex.harnessData =
      state.lastValidData ?? (d.data as Exchange['harnessData'] | undefined);
    ex.text = state.text || undefined;
    ex.chartData = state.chartData;
    ex.revealCharts = state.revealCharts;
    ex.reasoning = undefined;
    ex.activity = undefined;
    ex.activityLanguage = undefined;
    ex.toolCalls = undefined;
    useConversationStore().markExchangeDone(
      conversation.id,
      ex.requestId ?? '',
      {
        promptEvalCount: d.usage?.promptEvalCount,
        evalCount: d.usage?.evalCount,
      },
    );
  }

  function ensureConversationNumCtx(conversation: Conversation): void {
    const modelsStore = useModelsStore();
    if (conversation.numCtx || !conversation.model) return;
    const numCtx = modelsStore.maxNumCtxForModel(conversation.model);
    if (numCtx) {
      conversation.numCtx = numCtx;
      // Persist so the sidebar/context % stays in sync after a reload —
      // otherwise the cached contextUsagePercent was computed with an empty
      // numCtx and the sidebar shows nothing.
      useConversationStore().setNumCtx(conversation.id, numCtx);
    }
  }

  // ── Message-list bookkeeping (unread badge + DLQ retry dedup) ─────────
  /**
   * Keep one tracked entry per request id. Non-terminal phases keep it
   * pending (excluded from the unread count); terminal phases (completed /
   * failed / cancelled) mark it done so it becomes a live unread id.
   */
  function trackEnvelopeEntry(
    eventName: string,
    requestId: string,
    done: boolean,
  ): void {
    const index = messages.value.findIndex(
      (m) => m.data.requestId === requestId,
    );
    if (index !== -1) {
      const existing = messages.value[index];
      messages.value.splice(index, 1, {
        ...existing,
        data: {
          ...existing.data,
          pending: done ? undefined : existing.data.pending,
          done: done ? true : existing.data.done,
        },
      });
      return;
    }
    messages.value = [
      {
        time: formatTime(Date.now(), i18n.global.locale.value),
        event: eventName,
        data: {
          requestId,
          event: eventName || undefined,
          pending: done ? undefined : true,
          done: done ? true : undefined,
        },
      },
      ...messages.value,
    ];
  }

  function addPendingMessage(
    event: string,
    roomId: string,
    requestId: string,
    stream?: boolean,
  ) {
    trackedRequestIds.value.add(requestId);

    messages.value = [
      {
        time: formatTime(Date.now(), i18n.global.locale.value),
        event,
        data: {
          pending: true,
          requestId,
          event,
          roomId: roomId || undefined,
          stream: stream ?? undefined,
        },
      },
      ...messages.value,
    ];
  }

  function updatePendingMessage(requestId: string, data: unknown) {
    const d = data as MessageData;
    const msg = messages.value.find(
      (m) => m.event === d?.event && m.data.requestId === requestId,
    );
    if (msg && msg.data.pending) {
      msg.data = { ...msg.data, ...d, pending: false };
    }
  }

  function removeMessage(requestId: string) {
    const index = messages.value.findIndex(
      (m) => m.data.requestId === requestId,
    );
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
    trackedRequestIds.value.delete(requestId);
    readTracker.removeRead(requestId);
  }

  function clearMessages() {
    messages.value = [];
    trackedRequestIds.value.clear();
  }

  function markAsRead(requestId: string) {
    readTracker.markAsRead(requestId);
  }

  function isRead(requestId: string) {
    return readTracker.isRead(requestId);
  }

  const completedCount = computed(() => {
    const liveIds = messages.value
      .filter((m) => !m.data.pending)
      .map((m) => m.data.requestId)
      .filter(Boolean) as string[];
    return readTracker.unreadCount(liveIds);
  });

  return {
    messages,
    completedCount,
    markAsRead,
    isRead,
    addMessage,
    addPendingMessage,
    updatePendingMessage,
    removeMessage,
    clearMessages,
    trackRequest,
  };
});

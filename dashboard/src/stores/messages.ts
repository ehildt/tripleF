import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { createHarnessResponseState } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/state/create-harness-response-state.helper';
import type { HarnessResponseState } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/state/create-harness-response-state.helper.types';
import { processHarnessResponseEvent } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/state/process-harness-response-event.helper';
import { i18n } from '@/i18n/i18n';
import { type Exchange, useConversationStore } from '@/stores/conversation';
import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';
import { formatTime } from '@/utils/format-time.helper';

import { useReadTracker } from '../composables/use-read-tracker';
import { useAppStore } from '../stores/app';
import { useModelsStore } from '../stores/models';
import type { HarnessStreamEvent } from '../types/harness-stream-event.model';
import type { Message } from '../types/message.model';
import type { MessageData } from '../types/message-data.model';
import { extractUploadedImagesFromResponse } from './helpers/messages/extract-uploaded-images-from-response.helper';
import { isErrorStreamEvent } from './helpers/messages/is-error-stream-event.helper';
import { isHarnessStreamEvent } from './helpers/messages/is-harness-stream-event.helper';
import { mergeExistingMessageData } from './helpers/messages/merge-existing-message-data.helper';
import { normalizeRawData } from './helpers/messages/normalize-raw-data.helper';
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

/**
 * Apply the latest streamed state to an existing assistant exchange. The
 * done event clears the activity even when it carries no delta — structured
 * responses (e.g. stockmarket) stream no text, so a delta-only guard would
 * leave the "Assembling…" label stuck after completion.
 */
function applyStreamingState(
  existing: Exchange,
  state: HarnessResponseState,
  d: MessageData,
  status: Exchange['status'],
  fallbackContent: string,
  isError: boolean,
): void {
  if (isError) {
    existing.content = `Error: ${d.error}`;
    existing.status = status;
    return;
  }
  existing.content = fallbackContent;
  existing.status = status;
  existing.harnessTemplate = state.template ?? undefined;
  existing.harnessData = state.lastValidData ?? undefined;
  existing.text = state.text || undefined;
  existing.chartData = state.chartData;
  existing.revealCharts = state.revealCharts;
  if (d.done === true) {
    existing.reasoning = undefined;
    existing.activity = undefined;
    existing.activityLanguage = undefined;
  } else if (d.delta) {
    existing.reasoning = undefined;
    existing.activity = STREAMING_ACTIVITY;
    existing.activityLanguage = d.language;
  }
}

export const useApiMessagesStore = defineStore('apiMessages', () => {
  const messages = ref<Message[]>([]);
  const trackedRequestIds = ref<Set<string>>(new Set());
  const readTracker = useReadTracker('read-api-ids');
  const harnessStreamStates = new Map<string, HarnessResponseState>();

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

  function updateHarnessMessageEntry(
    d: MessageData,
    event: string,
    requestId: string,
  ): void {
    const existingIndex = messages.value.findIndex(
      (m) => m.data.requestId === requestId,
    );

    if (existingIndex !== -1) {
      const existing = messages.value[existingIndex];
      messages.value.splice(existingIndex, 1, {
        ...existing,
        data: {
          ...existing.data,
          ...d,
          pending: d.done === true ? undefined : existing.data.pending,
          done: d.done === true ? true : existing.data.done,
        },
      });
    } else {
      messages.value = [
        {
          time: formatTime(Date.now(), i18n.global.locale.value),
          event,
          data: { ...d, pending: d.done === true ? undefined : true },
        },
        ...messages.value,
      ];
    }
  }

  function updateHarnessSessionExchange(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    state: HarnessResponseState,
    d: MessageData,
    event: string,
    requestId: string,
  ): void {
    const conversationStore = useConversationStore();
    handlePrompt(
      conversation,
      d.prompt as string | undefined,
      requestId,
      event,
    );

    const existing = findAssistantExchange(conversation, requestId);

    const isError = isErrorStreamEvent(d);
    const status = d.done === true ? 'done' : 'streaming';

    const fallbackContent = state.text || state.lastValidData?.title || '';

    if (!existing) {
      if (isError) {
        conversationStore.addExchange(conversation.id, {
          role: 'assistant',
          content: `Error: ${d.error}`,
          requestId,
          status,
          event,
          promptEvalCount: d.promptEvalCount,
          evalCount: d.evalCount,
        });
      } else {
        conversationStore.addExchange(conversation.id, {
          role: 'assistant',
          content: fallbackContent,
          requestId,
          status,
          event,
          harnessTemplate: state.template ?? undefined,
          harnessData: state.lastValidData ?? undefined,
          text: state.text || undefined,
          chartData: state.chartData,
          revealCharts: state.revealCharts,
          activity: d.done === true ? undefined : STREAMING_ACTIVITY,
          activityLanguage: d.language,
          promptEvalCount: d.promptEvalCount,
          evalCount: d.evalCount,
        });
      }

      if (d.done === true) {
        ensureConversationNumCtx(conversation);
      }
      return;
    }

    applyStreamingState(existing, state, d, status, fallbackContent, isError);
    // Only a real response delta (or done) ends the tool phase — chart-series
    // events must not clear active tool calls.
    if (d.delta || d.done === true) {
      existing.toolCalls = undefined;
    }
    conversation.updatedAt = Date.now();

    if (d.done === true) {
      conversationStore.markExchangeDone(conversation.id, requestId, {
        promptEvalCount: d.promptEvalCount,
        evalCount: d.evalCount,
      });
      ensureConversationNumCtx(conversation);
    }
  }

  function ensureConversationNumCtx(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
  ) {
    const modelsStore = useModelsStore();
    if (conversation.numCtx || !conversation.model) return;

    const numCtx = modelsStore.maxNumCtxForModel(conversation.model);
    if (numCtx) {
      conversation.numCtx = numCtx;
      // Persist the auto-derived context size so the stored percentage and
      // the server snapshot stay in sync — otherwise the sidebar shows
      // nothing for this conversation after a reload (its saved
      // contextUsagePercent was computed with an empty numCtx).
      useConversationStore().setNumCtx(conversation.id, numCtx);
    }
  }

  function handleHarnessStream(event: string, data: unknown) {
    normalizeRawData(data as Record<string, unknown>);
    const d = data as unknown as MessageData;
    const requestId = d.requestId;
    if (!requestId) return;

    const streamEvent: HarnessStreamEvent = {
      requestId,
      template: d.template,
      delta: d.delta,
      status: d.status,
      activity: d.activity,
      language: d.language,
      // Authoritative payload of the non-streaming retry: when the streamed
      // deltas were not valid JSON, this is the only place the validated
      // response reaches the client.
      data: d.data,
      images: d.images,
      toolResults: d.toolResults,
      done: d.done,
      // Chart series streamed right after an EODHD tool ran, buffered and
      // revealed once the respond step streams its first delta.
      chartData: d.chartData,
    };

    const state = processHarnessResponseEvent(
      getOrCreateHarnessStreamState(requestId),
      streamEvent,
    );
    harnessStreamStates.set(requestId, state);

    updateHarnessMessageEntry(d, event, requestId);

    const conversationStore = useConversationStore();
    for (const conversation of conversationStore.conversations) {
      if (conversation.event && conversation.event !== event) continue;
      updateHarnessSessionExchange(conversation, state, d, event, requestId);
    }

    for (const conversation of conversationStore.conversations) {
      if (conversation.event && conversation.event !== event) continue;
      const uploadedImages = extractUploadedImagesFromResponse(
        data as Record<string, unknown>,
        conversationStore.getConversationId(conversation.id),
      );
      if (uploadedImages.length > 0) {
        conversationStore.setUploadedImages(conversation.id, uploadedImages);
      }
    }

    useAppStore().notifyChatResponse();
  }

  function handlePrompt(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    prompt: string | undefined,
    requestId: string,
    event: string,
  ) {
    if (!prompt) return;
    const conversationStore = useConversationStore();
    if (
      conversation.exchanges.some(
        (e) => e.role === 'user' && e.requestId === requestId,
      )
    )
      return;

    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: prompt,
      requestId,
      status: 'done',
      event,
    });
  }

  function handleNewContent(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    newContent: string | undefined,
    requestId: string,
    d: MessageData,
  ) {
    if (!newContent) return;
    const conversationStore = useConversationStore();
    const hasExchange = conversation.exchanges.some(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );

    if (!hasExchange) {
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: newContent,
        requestId,
        status: d.done ? 'done' : 'streaming',
        activity: d.done ? undefined : STREAMING_ACTIVITY,
        activityLanguage: d.language,
        promptEvalCount: d.promptEvalCount,
        evalCount: d.evalCount,
      });
    } else {
      const ex = findAssistantExchange(conversation, requestId);
      if (ex) {
        ex.toolCalls = undefined;
        // Streamed content ends the thinking phase — see
        // updateHarnessSessionExchange for the same transition.
        ex.reasoning = undefined;
        ex.activity = d.done ? undefined : STREAMING_ACTIVITY;
        ex.activityLanguage = d.language;
      }
      conversationStore.appendExchangeContent(
        conversation.id,
        requestId,
        newContent,
      );
    }
  }

  function handleDone(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    requestId: string,
    d: MessageData,
  ) {
    if (d.done !== true) return;
    const conversationStore = useConversationStore();

    conversationStore.markExchangeDone(conversation.id, requestId, {
      promptEvalCount: d.promptEvalCount,
      evalCount: d.evalCount,
    });

    ensureConversationNumCtx(conversation);

    const ex = findAssistantExchange(conversation, requestId);
    if (ex) {
      ex.activity = undefined;
      ex.reasoning = undefined;
      ex.toolCalls = undefined;
    }
  }

  function handleActivityStatus(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    raw: Record<string, unknown>,
    requestId: string,
  ) {
    if (raw.done === true) return;
    const activity = raw.activity as HarnessActivityDescriptor | undefined;
    if (!activity?.key) return;
    const language = raw.language as string | undefined;
    const ex = findAssistantExchange(conversation, requestId);
    if (ex) {
      ex.activity = activity;
      if (language) ex.activityLanguage = language;
    }
  }

  function handleReasoningDelta(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    raw: Record<string, unknown>,
    requestId: string,
  ) {
    const delta = raw.reasoningDelta as string | undefined;
    if (!delta) return;
    const ex = findAssistantExchange(conversation, requestId);
    if (ex) {
      ex.reasoning = (ex.reasoning ?? '') + delta;
      const language = raw.language as string | undefined;
      if (language) ex.activityLanguage = language;
    }
  }

  function handleToolCall(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    raw: Record<string, unknown>,
    requestId: string,
  ) {
    const tc = raw.toolCall as
      | {
          name?: string;
          category?: string;
          query?: string;
          status?: string;
        }
      | undefined;
    if (!tc?.name) return;
    const conversationStore = useConversationStore();

    let ex = findAssistantExchange(conversation, requestId);
    if (!ex) {
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: '',
        requestId,
        status: 'pending',
      });
      ex = findAssistantExchange(conversation, requestId);
    }
    if (!ex) return;

    // Key active calls by (name, query): the same tool can run several
    // parallel searches with different queries, and each is a real,
    // countable search — collapsing them by name alone would under-report
    // the count (e.g. always "2" for the two video tools).
    const toolKey = (call: { name?: string; query?: string }) =>
      `${call.name ?? ''}\u0000${call.query ?? ''}`;
    const active = (ex.toolCalls ?? []).filter(
      (t) => toolKey(t) !== toolKey(tc),
    );
    const language = raw.language as string | undefined;
    if (language) ex.activityLanguage = language;

    if (tc.status === 'done' || tc.status === 'error') {
      ex.toolCalls = active.length ? active : undefined;
      return;
    }

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

  function bridgeToSession(event: string, data: unknown) {
    const raw = data as Record<string, unknown>;
    normalizeRawData(raw);

    const d = raw as unknown as MessageData;
    const requestId = d?.requestId || d?.meta?.[0]?.requestId;
    if (!requestId) return;

    const conversationStore = useConversationStore();
    const newContent = d.message?.content;

    for (const conversation of conversationStore.conversations) {
      if (conversation.event && conversation.event !== event) continue;

      handlePrompt(
        conversation,
        raw.prompt as string | undefined,
        requestId,
        event,
      );
      handleNewContent(conversation, newContent, requestId, d);
      handleActivityStatus(conversation, raw, requestId);
      handleReasoningDelta(conversation, raw, requestId);
      handleDone(conversation, requestId, d);
      handleToolCall(conversation, raw, requestId);
    }
  }

  function handleCanceledMessage(requestId: string | undefined) {
    if (!requestId) return;
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

  function tryUpdateExistingMessage(
    requestId: string,
    d: MessageData,
    event: string,
    data: unknown,
  ): boolean {
    const existingIndex = messages.value.findIndex(
      (m) =>
        m.data.requestId === requestId ||
        m.data.meta?.[0]?.requestId === requestId,
    );
    if (existingIndex === -1) return false;

    const existing = messages.value[existingIndex];
    const updatedData = mergeExistingMessageData(existing.data, d);

    messages.value.splice(existingIndex, 1, {
      ...existing,
      data: updatedData,
    });

    bridgeToSession(event, data);
    useAppStore().notifyChatResponse();
    return true;
  }

  function addMessage(event: string, data: unknown) {
    const raw = data as Record<string, unknown>;
    normalizeRawData(raw);

    const d = raw as unknown as MessageData;
    const requestId = d?.requestId || d?.meta?.[0]?.requestId;

    if (d?.canceled || d?.status === 'canceled') {
      handleCanceledMessage(requestId);
      return;
    }

    if (requestId && isHarnessStreamEvent(d)) {
      handleHarnessStream(event, data);
      return;
    }

    if (requestId && tryUpdateExistingMessage(requestId, d, event, data)) {
      return;
    }

    messages.value = [
      {
        time: formatTime(Date.now(), i18n.global.locale.value),
        event,
        data: d as MessageData,
      },
      ...messages.value,
    ];

    bridgeToSession(event, data);
    useAppStore().notifyChatResponse();
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
      bridgeToSession(d.event ?? '', data);
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

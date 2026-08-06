import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  createHarnessResponseState,
  type HarnessResponseState,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/create-harness-response-state.helper';
import { processHarnessResponseEvent } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/process-harness-response-event.helper';
import { type Exchange, useConversationStore } from '@/stores/conversation';

import { useReadTracker } from '../composables/use-read-tracker';
import { useAppStore } from '../stores/app';
import { useModelsStore } from '../stores/models';
import type { HarnessStreamEvent } from '../types/harness-stream-event.model';
import type { Message } from '../types/message.model';
import type { MessageData } from '../types/message-data.model';
import { extractUploadedImagesFromResponse } from './helpers/extract-uploaded-images-from-response.helper';
import { isErrorStreamEvent } from './helpers/is-error-stream-event.helper';
import { isHarnessStreamEvent } from './helpers/is-harness-stream-event.helper';
import { mergeExistingMessageData } from './helpers/merge-existing-message-data.helper';
import { normalizeRawData } from './helpers/normalize-raw-data.helper';

/**
 * Activity label shown while the model streams response data: the thinking
 * phase is over, the response is being assembled token by token.
 */
const STREAMING_ACTIVITY_LABEL = 'Assembling the response…';

type Conversation = ReturnType<
  typeof useConversationStore
>['conversations'][number];

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
          time: new Date().toLocaleTimeString(),
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
          activity: d.done === true ? undefined : STREAMING_ACTIVITY_LABEL,
          promptEvalCount: d.promptEvalCount,
          evalCount: d.evalCount,
        });
      }

      if (d.done === true) {
        ensureConversationNumCtx(conversation);
      }
      return;
    }

    if (isError) {
      existing.content = `Error: ${d.error}`;
      existing.status = status;
    } else {
      existing.content = fallbackContent;
      existing.status = status;
      existing.harnessTemplate = state.template ?? undefined;
      existing.harnessData = state.lastValidData ?? undefined;
      existing.text = state.text || undefined;
      // A delta means the model left its thinking phase and is emitting the
      // response: drop the reasoning label and announce the assembly until
      // the done event clears it.
      existing.reasoning = undefined;
      existing.activity =
        d.done === true ? undefined : STREAMING_ACTIVITY_LABEL;
    }
    existing.toolCalls = undefined;
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
      // Authoritative payload of the non-streaming retry: when the streamed
      // deltas were not valid JSON, this is the only place the validated
      // response reaches the client.
      data: d.data,
      images: d.images,
      toolResults: d.toolResults,
      done: d.done,
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
        activity: d.done ? undefined : STREAMING_ACTIVITY_LABEL,
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
        ex.activity = d.done ? undefined : STREAMING_ACTIVITY_LABEL;
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
    raw: Record<string, unknown>,
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
    const status = raw.status as string | undefined;
    if (!status || status === 'canceled') return;
    const ex = findAssistantExchange(conversation, requestId);
    if (ex) ex.activity = status;
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
    if (ex) ex.reasoning = (ex.reasoning ?? '') + delta;
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

    const active = (ex.toolCalls ?? []).filter((t) => t.name !== tc.name);

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
      handleDone(conversation, raw, requestId, d);
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
        time: new Date().toLocaleTimeString(),
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
        time: new Date().toLocaleTimeString(),
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

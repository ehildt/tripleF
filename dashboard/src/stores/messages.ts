import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  createHarnessResponseState,
  type HarnessResponseState,
} from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/create-harness-response-state.helper';
import { processHarnessResponseEvent } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/process-harness-response-event.helper';
import {
  type UploadedImage,
  useConversationStore,
} from '@/stores/conversation';

import { useReadTracker } from '../composables/use-read-tracker';
import { useAppStore } from '../stores/app';
import type { HarnessStreamEvent } from '../types/harness-stream-event.model';
import type { Message } from '../types/message.model';
import type { MessageData } from '../types/message-data.model';
export const useApiMessagesStore = defineStore('apiMessages', () => {
  const messages = ref<Message[]>([]);
  const trackedRequestIds = ref<Set<string>>(new Set());
  const readTracker = useReadTracker('read-api-ids');
  const harnessStreamStates = new Map<string, HarnessResponseState>();

  function trackRequest(requestId: string) {
    trackedRequestIds.value.add(requestId);
  }

  function normalizeRawData(raw: Record<string, unknown>) {
    if (
      raw.prompt_eval_count !== undefined &&
      raw.promptEvalCount === undefined
    ) {
      raw.promptEvalCount = raw.prompt_eval_count;
    }
    if (raw.eval_count !== undefined && raw.evalCount === undefined) {
      raw.evalCount = raw.eval_count;
    }
    if (raw.eval_duration !== undefined && raw.evalDuration === undefined) {
      raw.evalDuration = raw.eval_duration;
    }
    if (raw.total_duration !== undefined && raw.totalDuration === undefined) {
      raw.totalDuration = raw.total_duration;
    }
  }

  function isHarnessStreamEvent(d: MessageData): boolean {
    return d.template !== undefined && d.delta !== undefined;
  }

  function isErrorStreamEvent(d: MessageData): boolean {
    return d.error !== undefined && d.done === true;
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

  function extractUploadedImagesFromResponse(
    data: Record<string, unknown>,
    conversationId: string,
    conversationStore: ReturnType<typeof useConversationStore>,
  ): UploadedImage[] {
    const meta = data.meta as
      | Array<{
          name?: string;
          hash?: string;
          size?: number;
          variant?: string;
        }>
      | undefined;
    if (!Array.isArray(meta)) return [];
    const cid = conversationStore.getConversationId(conversationId);
    return meta
      .filter(
        (entry): entry is { name: string; hash: string; size?: number } =>
          typeof entry.name === 'string' &&
          typeof entry.hash === 'string' &&
          (!entry.variant || entry.variant === 'original'),
      )
      .map((entry) => ({
        name: entry.name,
        hash: entry.hash,
        size: entry.size,
        uploadedAt: Date.now(),
        selected: true,
        conversationId: cid,
      }));
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

    const existing = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );

    const isError = isErrorStreamEvent(d);
    const status = d.done === true ? 'done' : 'streaming';

    const fallbackContent = state.text || state.lastValidData?.title || '';

    if (!existing) {
      if (isError) {
        conversationStore.addExchange(conversation.id, {
          role: 'assistant',
          content: buildErrorText(d.error!),
          requestId,
          status,
          event,
          promptEvalCount: d.promptEvalCount,
          evalCount: d.evalCount,
        });
        return;
      }

      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: fallbackContent,
        requestId,
        status,
        event,
        harnessTemplate: state.template ?? undefined,
        harnessData: state.lastValidData ?? undefined,
        text: state.text || undefined,
        promptEvalCount: d.promptEvalCount,
        evalCount: d.evalCount,
      });
      return;
    }

    if (isError) {
      existing.content = buildErrorText(d.error!);
      existing.status = status;
    } else {
      existing.content = fallbackContent;
      existing.status = status;
      existing.harnessTemplate = state.template ?? undefined;
      existing.harnessData = state.lastValidData ?? undefined;
      existing.text = state.text || undefined;
    }
    existing.toolCall = undefined;
    conversation.updatedAt = Date.now();

    if (d.done === true) {
      conversationStore.markExchangeDone(conversation.id, requestId, {
        promptEvalCount: d.promptEvalCount,
        evalCount: d.evalCount,
      });
    }
  }

  function buildErrorText(error: string): string {
    return `Error: ${error}`;
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
        conversation.id,
        conversationStore,
      );
      if (uploadedImages.length > 0) {
        conversationStore.setUploadedImages(conversation.id, uploadedImages);
      }
    }

    useAppStore().notifyChatResponse();
  }

  function handleCompactMode(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    raw: Record<string, unknown>,
    requestId: string,
  ) {
    const conversationStore = useConversationStore();
    if (raw.done === true) {
      conversationStore.compacting = false;
    } else if (!conversationStore.compacting) {
      conversationStore.compacting = true;
    }

    if (
      raw.status === 'compacting' &&
      !conversation.exchanges.some(
        (e) => e.requestId === requestId && e.role === 'assistant',
      )
    ) {
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: '',
        requestId,
        status: 'pending',
      });
    }
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
        promptEvalCount: d.promptEvalCount,
        evalCount: d.evalCount,
      });
    } else {
      const ex = conversation.exchanges.find(
        (e) => e.requestId === requestId && e.role === 'assistant',
      );
      if (ex) {
        ex.toolCall = undefined;
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

    const ex = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (ex) {
      ex.phase = undefined;
      ex.toolCall = undefined;
    }

    if (raw.compact === true) {
      const ex = conversation.exchanges.find(
        (e) => e.requestId === requestId && e.role === 'assistant',
      );
      if (ex && ex.content.trim()) {
        ex.requestId = undefined;
        conversation.exchanges = [ex];
      }
    }
  }

  function handlePhase(
    conversation: ReturnType<
      typeof useConversationStore
    >['conversations'][number],
    raw: Record<string, unknown>,
    requestId: string,
  ) {
    const phase = raw.phase as
      | 'classifying'
      | 'strategizing'
      | 'summarizing'
      | 'rendering'
      | 'reviewing'
      | undefined;
    const status = raw.status as string | undefined;
    if (!phase) return;
    const ex = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (ex) {
      if (status === 'start') ex.phase = phase;
      else if (status === 'end') ex.phase = undefined;
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
      { name?: string; input?: unknown; status?: string } | undefined;
    if (!tc?.name) return;
    const conversationStore = useConversationStore();

    let ex = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (!ex) {
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: '',
        requestId,
        status: 'pending',
      });
      ex = conversation.exchanges.find(
        (e) => e.requestId === requestId && e.role === 'assistant',
      );
    }
    if (
      ex &&
      (tc.status === 'start' ||
        tc.status === 'running' ||
        tc.status === 'compacting' ||
        tc.status === 'preparing')
    ) {
      ex.toolCall = {
        name: tc.name,
        input: tc.input ?? ex.toolCall?.input,
        status: tc.status,
      };
    }
    if (ex && (tc.status === 'done' || tc.status === 'error')) {
      ex.toolCall = undefined;
    }
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

      if (raw.compact === true) {
        handleCompactMode(conversation, raw, requestId);
      }

      handlePrompt(
        conversation,
        raw.prompt as string | undefined,
        requestId,
        event,
      );
      handleNewContent(conversation, newContent, requestId, d);
      handlePhase(conversation, raw, requestId);
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
    const existingContent = existing.data.message?.content;
    const newContent = d.message?.content;

    const updatedData: MessageData = {
      ...existing.data,
      message: newContent
        ? { content: (existingContent || '') + newContent }
        : existing.data.message,
      pending:
        newContent || d.done === true ? undefined : existing.data.pending,
      done: d.done === true ? true : existing.data.done,
      conversationId: d.conversationId || existing.data.conversationId,
      promptEvalCount:
        d.done === true ? d.promptEvalCount : existing.data.promptEvalCount,
      evalCount: d.done === true ? d.evalCount : existing.data.evalCount,
    };
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

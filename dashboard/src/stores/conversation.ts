import { defineStore } from 'pinia';
import TurndownService from 'turndown';
import { ref, watch } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { getApiUrl } from '../api/api-url';
import { deleteUploadedObject } from '../api/storage.api';
import { clearPendingFilesForConversation } from '../composables/attached-files.state';
import type { ConversationMetadataImage } from '../utils/build-query-params.helper';
import { createId } from '../utils/id.helper';
import { calcInputTokenDelta } from './helpers/calc-input-token-delta.helper';
import { toPromptMessage } from './helpers/to-prompt-message.helper';
import { useSocketStore } from './socket';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

interface SavedFileInfo {
  name: string;
  size: number;
  type: string;
}

export interface UploadedImage {
  name: string;
  hash: string;
  uploadedAt: number;
  size?: number;
  selected?: boolean;
  conversationId: string;
  source?: 'local' | 'cloud';
}

export interface Exchange {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  requestId?: string;
  status: 'pending' | 'streaming' | 'done' | 'error';
  timestamp: number;
  model?: string;
  event?: string;
  roomId?: string;
  conversationId?: string;
  // Token data: promptEvalCount is the cumulative input token count reported
  // by Ollama for this turn. evalCount is the output tokens for this response.
  // inputTokenDelta holds the non-cumulative inputs added by this specific
  // turn so excluded exchanges can be deducted from totals correctly.
  promptEvalCount?: number;
  evalCount?: number;
  inputTokenDelta?: number;
  // Currently running tool calls for this exchange. Parallel searches are
  // tracked individually so the activity label can group them by category
  // instead of flickering through near-duplicate labels.
  toolCalls?: Array<{
    name: string;
    category?: string;
    query?: string;
    status: string;
  }>;
  // Live activity while the request is processed: the current step or tool
  // label (fallback for non-thinking models) and the streamed thinking text.
  activity?: string;
  reasoning?: string;
  included?: boolean;
  // Images that were associated with this prompt, either uploaded as new
  // files in the form data or referenced through conversation metadata.
  images?: ConversationMetadataImage[];
  harnessTemplate?: string;
  harnessData?: HarnessResponseData;
  text?: string;
}

interface ConversationSubscription {
  event: string;
  roomId: string;
}

type ConversationType = 'temporary' | 'persistent';

export interface Conversation {
  id: string;
  title: string;
  exchanges: Exchange[];
  files: File[];
  savedFileInfos: SavedFileInfo[];
  uploadedImages: UploadedImage[];
  imageSelectionSnapshot: Record<string, boolean>;
  conversationId: string;
  model: string;
  numCtx: string;
  think: string;
  event: string;
  roomId: string;
  stream: boolean;
  subscriptions: ConversationSubscription[];
  type: ConversationType;
  task?: string;
  createdAt: number;
  updatedAt: number;
}

interface PersistedConversation {
  id: string;
  title: string;
  exchanges: Exchange[];
  savedFileInfos: SavedFileInfo[];
  uploadedImages: UploadedImage[];
  imageSelectionSnapshot?: Record<string, boolean>;
  conversationId: string;
  model: string;
  numCtx: string;
  think: string;
  event: string;
  roomId: string;
  stream: boolean;
  subscriptions?: ConversationSubscription[];
  type: ConversationType;
  task?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'harness-conversations';
const ACTIVE_SESSION_KEY = 'harness-active-conversation';
const TEMP_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function createConversation(partial?: Partial<Conversation>): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: 'New Conversation',
    exchanges: [],
    files: [],
    savedFileInfos: [],
    uploadedImages: partial?.uploadedImages ?? [],
    imageSelectionSnapshot: partial?.imageSelectionSnapshot ?? {},
    conversationId: partial?.conversationId ?? createId(),
    model: partial?.model ?? '',
    numCtx: partial?.numCtx ?? '',
    think: partial?.think ?? 'medium',
    event: partial?.event ?? '',
    roomId: partial?.roomId ?? '',
    stream: partial?.stream ?? true,
    subscriptions: partial?.subscriptions ?? [],
    type: partial?.type ?? 'temporary',
    createdAt: now,
    updatedAt: now,
  };
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const persisted: PersistedConversation[] = JSON.parse(raw);
    const now = Date.now();
    return persisted
      .filter((p) => {
        if (p.type !== 'temporary') return true;
        return now - p.updatedAt <= TEMP_SESSION_TTL_MS;
      })
      .map((p) => {
        const persisted = { ...(p as any) };
        delete persisted.task;
        return {
          ...persisted,
          files: [],
          uploadedImages: (p.uploadedImages ?? []).map((img) => ({
            ...img,
            selected: img.selected ?? true,
          })),
          imageSelectionSnapshot: p.imageSelectionSnapshot ?? {},
          conversationId: p.conversationId ?? createId(),
          subscriptions: p.subscriptions ?? [],
          type: p.type ?? 'temporary',
        };
      });
  } catch {
    return [];
  }
}

function persistConversations(conversations: Conversation[]) {
  const toSave: PersistedConversation[] = conversations.map((s) => ({
    id: s.id,
    title: s.title,
    exchanges: s.exchanges,
    savedFileInfos: s.savedFileInfos,
    uploadedImages: s.uploadedImages,
    imageSelectionSnapshot: s.imageSelectionSnapshot,
    conversationId: s.conversationId,
    model: s.model,
    numCtx: s.numCtx,
    think: s.think,
    event: s.event,
    roomId: s.roomId,
    stream: s.stream,
    subscriptions: s.subscriptions,
    type: s.type,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function loadActiveConversationId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

function persistActiveConversationId(id: string | null) {
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>(loadConversations());
  const activeConversationId = ref<string | null>(loadActiveConversationId());
  const compacting = ref(false);

  function getConversation(id: string): Conversation | undefined {
    return conversations.value.find((s) => s.id === id);
  }

  function ensureConversation(): Conversation {
    const existing = activeConversationId.value
      ? getConversation(activeConversationId.value)
      : undefined;
    if (existing) return existing;

    const cid = createId();
    const conversation = createConversation({
      type: 'temporary',
      event: cid,
      conversationId: cid,
    });
    conversations.value.unshift(conversation);
    activeConversationId.value = conversation.id;
    return conversation;
  }

  function setActiveConversation(id: string) {
    if (getConversation(id)) {
      activeConversationId.value = id;
    }
  }

  function createNewConversation(
    type: ConversationType = 'temporary',
    event?: string,
    roomId?: string,
  ): Conversation {
    const conversation = createConversation({
      type,
      event: event || createId(),
      roomId: roomId || '',
    });
    conversations.value.unshift(conversation);
    activeConversationId.value = conversation.id;
    return conversation;
  }

  function deleteConversation(id: string) {
    const idx = conversations.value.findIndex((s) => s.id === id);
    if (idx === -1) return;
    conversations.value.splice(idx, 1);
    conversationFileMap.value = Object.fromEntries(
      Object.entries(conversationFileMap.value).filter(([k]) => k !== id),
    );
    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null;
    }
  }

  async function deleteCurrentConversation(parentId: string) {
    const conversation = getConversation(parentId);
    if (!conversation) return;

    const conversationId = conversation.conversationId;

    const removedImages = conversation.uploadedImages.filter(
      (img) => (img.conversationId ?? conversationId) === conversationId,
    );

    clearPendingFilesForConversation(parentId, conversationId);

    conversation.exchanges = conversation.exchanges.filter(
      (e) => (e.conversationId ?? conversationId) !== conversationId,
    );
    conversation.uploadedImages = conversation.uploadedImages.filter(
      (img) => (img.conversationId ?? conversationId) !== conversationId,
    );

    const shouldRemoveConversation = conversation.exchanges.length === 0;

    for (const img of removedImages) {
      const stillReferenced = hasUploadedImageReference(
        parentId,
        img.hash,
        conversationId,
      );
      if (!stillReferenced) {
        try {
          await deleteUploadedObject(parentId, conversationId, img.hash);
        } catch {
          // Object may already be gone or storage unreachable.
        }
      }
    }

    if (shouldRemoveConversation) {
      const idx = conversations.value.findIndex((s) => s.id === parentId);
      if (idx !== -1) conversations.value.splice(idx, 1);
      conversationFileMap.value = Object.fromEntries(
        Object.entries(conversationFileMap.value).filter(
          ([k]) => k !== parentId,
        ),
      );
      if (activeConversationId.value === parentId) {
        activeConversationId.value = conversations.value[0]?.id ?? null;
      }
    }
  }

  function renameConversation(id: string, title: string) {
    const conversation = getConversation(id);
    if (conversation) {
      conversation.title = title;
    }
  }

  function addExchange(
    conversationId: string,
    exchange: Omit<Exchange, 'timestamp' | 'id'>,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    conversation.exchanges.push({
      ...exchange,
      id: createId(),
      timestamp: Date.now(),
    });
    conversation.updatedAt = Date.now();
    if (conversation.title === 'New Conversation') {
      conversation.title = exchange.content.slice(0, 50) || 'New Conversation';
    }
  }

  function deleteExchangeAndPrune(conversationId: string, exchangeId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const idx = conversation.exchanges.findIndex((e) => e.id === exchangeId);
    if (idx === -1) return;
    const next = conversation.exchanges[idx + 1];
    if (
      next?.role === 'assistant' &&
      next.requestId === conversation.exchanges[idx].requestId
    )
      conversation.exchanges.splice(idx, 2);
    else conversation.exchanges.splice(idx, 1);
  }

  function toggleConversationType(conversationId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    conversation.type =
      conversation.type === 'temporary' ? 'persistent' : 'temporary';
  }

  async function compactExchanges(conversationId: string) {
    const conversation = getConversation(conversationId);
    if (
      !conversation ||
      conversation.exchanges.length === 0 ||
      compacting.value
    )
      return;

    const model = conversation.model;
    if (!model) return;

    const requestId = createId();
    const event = conversation.event || 'harness';
    const roomId = conversation.roomId;

    const compactPayload = conversation.exchanges
      .filter((e) => e.content.trim())
      .map((e) => ({
        role: e.role,
        content: e.content,
      }));

    conversation.exchanges = [];

    const exchangeId = createId();
    conversation.exchanges.push({
      id: exchangeId,
      role: 'assistant',
      content: '',
      requestId,
      status: 'pending',
      timestamp: Date.now(),
      model,
      event,
      roomId,
    });

    compacting.value = true;

    const socketStore = useSocketStore();
    socketStore.ensureSocketConnection();

    if (roomId) socketStore.joinRoom(roomId, event);

    const body = {
      exchanges: compactPayload,
      model,
      requestId,
      roomId,
      stream: true,
      event,
    };

    try {
      const res = await fetch(getApiUrl('/api/v1/harness/compact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) compacting.value = false;
    } catch {
      compacting.value = false;
    }
  }

  function updateExchange(
    conversationId: string,
    requestId: string,
    updates: Partial<Pick<Exchange, 'content' | 'status'>>,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const exchange = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (exchange) {
      if (updates.content !== undefined) exchange.content = updates.content;

      if (updates.status !== undefined) exchange.status = updates.status;

      conversation.updatedAt = Date.now();
    }
  }

  function appendExchangeContent(
    conversationId: string,
    requestId: string,
    chunk: string,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const exchange = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (exchange) {
      exchange.content += chunk;
      exchange.status = 'streaming';
      conversation.updatedAt = Date.now();
    }
  }

  function markExchangeDone(
    conversationId: string,
    requestId: string,
    tokenData?: { promptEvalCount?: number; evalCount?: number },
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const exchange = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (!exchange) return;

    exchange.status = 'done';
    if (tokenData) {
      exchange.promptEvalCount = tokenData.promptEvalCount;
      exchange.evalCount = tokenData.evalCount;
      if (tokenData.promptEvalCount != null) {
        exchange.inputTokenDelta = calcInputTokenDelta(
          conversation.exchanges,
          tokenData.promptEvalCount,
        );
      }
    }
    conversation.updatedAt = Date.now();
  }

  function markExchangeError(
    conversationId: string,
    requestId: string,
    errorMessage?: string,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const exchange = conversation.exchanges.find(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (exchange) {
      exchange.status = 'error';
      if (errorMessage) exchange.content = errorMessage;
      conversation.updatedAt = Date.now();
    }
  }

  const conversationFileMap = ref<Record<string, File[]>>({});

  function setFiles(conversationId: string, newFiles: File[]) {
    conversationFileMap.value = {
      ...conversationFileMap.value,
      [conversationId]: newFiles,
    };
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    conversation.files = newFiles;
    conversation.savedFileInfos = newFiles.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
  }

  function getFiles(conversationId: string): File[] {
    const conversation = getConversation(conversationId);
    return (
      conversationFileMap.value[conversationId] ?? conversation?.files ?? []
    );
  }

  function setModel(conversationId: string, model: string) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.model = model;
  }

  function setNumCtx(conversationId: string, numCtx: string) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.numCtx = numCtx;
  }

  function setThink(conversationId: string, think: string) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.think = think;
  }

  function setStream(conversationId: string, stream: boolean) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.stream = stream;
  }

  function setEvent(conversationId: string, event: string) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.event = event;
  }

  function setRoomId(conversationId: string, roomId: string) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.roomId = roomId;
  }

  function getConversationId(conversationId: string): string {
    const conversation = getConversation(conversationId);
    if (!conversation) return createId();
    if (!conversation.conversationId) conversation.conversationId = createId();
    return conversation.conversationId;
  }

  function setConversationId(
    conversationId: string,
    newConversationId: string,
  ) {
    const conversation = getConversation(conversationId);
    if (conversation) conversation.conversationId = newConversationId;
  }

  function setUploadedImages(conversationId: string, images: UploadedImage[]) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const cid = getConversationId(conversationId);
    const seen = new Set<string>();
    const merged: UploadedImage[] = [];
    for (const img of [...conversation.uploadedImages, ...images]) {
      const key = `${img.hash}:${img.conversationId ?? cid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = conversation.uploadedImages.find(
        (i) =>
          i.hash === img.hash &&
          (i.conversationId ?? cid) === (img.conversationId ?? cid),
      );
      merged.push({
        ...img,
        conversationId: img.conversationId ?? cid,
        selected: existing?.selected ?? img.selected ?? true,
        source:
          img.source === 'cloud'
            ? ('cloud' as const)
            : (existing?.source ?? img.source ?? 'local'),
      });
    }
    conversation.uploadedImages = merged;
  }

  function getUploadedImagesForConversation(
    conversationId: string,
    targetConversationId?: string,
  ): UploadedImage[] {
    const conversation = getConversation(conversationId);
    if (!conversation) return [];
    const cid = targetConversationId ?? getConversationId(conversationId);
    return conversation.uploadedImages.filter(
      (img) => (img.conversationId ?? cid) === cid,
    );
  }

  function hasUploadedImageReference(
    conversationId: string,
    hash: string,
    excludeConversationId?: string,
  ): boolean {
    const conversation = getConversation(conversationId);
    if (!conversation) return false;
    return conversation.uploadedImages.some(
      (img) =>
        img.hash === hash &&
        (!excludeConversationId ||
          img.conversationId !== excludeConversationId),
    );
  }

  function toggleUploadedImageSelected(
    conversationId: string,
    hash: string,
    targetConversationId?: string,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const cid = targetConversationId ?? getConversationId(conversationId);
    const image = conversation.uploadedImages.find(
      (img) => img.hash === hash && (img.conversationId ?? cid) === cid,
    );
    if (image) image.selected = image.selected !== false ? false : true;
  }

  function snapshotImageSelections(conversationId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const cid = getConversationId(conversationId);
    const snapshot: Record<string, boolean> = {};
    for (const img of conversation.uploadedImages) {
      if ((img.conversationId ?? cid) !== cid) continue;
      snapshot[img.hash] = img.selected !== false;
    }
    conversation.imageSelectionSnapshot = snapshot;
  }

  function restoreImageSelections(conversationId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    if (Object.keys(conversation.imageSelectionSnapshot).length === 0) return;
    const cid = getConversationId(conversationId);
    for (const img of conversation.uploadedImages) {
      if ((img.conversationId ?? cid) !== cid) continue;
      const saved = conversation.imageSelectionSnapshot[img.hash];
      if (saved !== undefined) {
        img.selected = saved;
      }
    }
  }

  function deselectAllImages(conversationId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const cid = getConversationId(conversationId);
    for (const img of conversation.uploadedImages) {
      if ((img.conversationId ?? cid) === cid) {
        img.selected = false;
      }
    }
  }

  function removeUploadedImage(
    conversationId: string,
    hash: string,
    targetConversationId?: string,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const cid = targetConversationId ?? getConversationId(conversationId);
    conversation.uploadedImages = conversation.uploadedImages.filter(
      (img) => !(img.hash === hash && (img.conversationId ?? cid) === cid),
    );
  }

  function setSubscriptions(
    conversationId: string,
    subscriptions: ConversationSubscription[],
  ) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.subscriptions = subscriptions;
    }
  }

  function toggleExchangeIncluded(conversationId: string, exchangeId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const idx = conversation.exchanges.findIndex((e) => e.id === exchangeId);
    if (idx === -1) return;

    // Toggle this exchange and its paired partner so both user prompt +
    // assistant response are included/excluded together.
    const target = conversation.exchanges[idx];
    const newVal = target.included !== false ? false : true;
    target.included = newVal;

    // Check forward for paired assistant, or backward for paired user
    if (
      idx < conversation.exchanges.length - 1 &&
      conversation.exchanges[idx + 1].requestId === target.requestId
    ) {
      conversation.exchanges[idx + 1].included = newVal;
    } else if (
      idx > 0 &&
      conversation.exchanges[idx - 1].requestId === target.requestId
    ) {
      conversation.exchanges[idx - 1].included = newVal;
    }
  }

  function buildPrompt(conversationId: string): string {
    const conversation = getConversation(conversationId);
    if (!conversation) return '[]';
    const messages = conversation.exchanges
      .filter((e) => e.included !== false)
      .map((e) => {
        const message = toPromptMessage(e);
        return {
          role: message.role,
          content: turndown.turndown(message.content),
        };
      })
      .filter(
        (m) =>
          m.role !== 'assistant' || (m.content && m.content.trim().length > 0),
      );
    return JSON.stringify(messages);
  }

  watch(activeConversationId, (id) => persistActiveConversationId(id));
  watch(conversations, (v) => persistConversations(v), { deep: true });

  return {
    conversations,
    activeConversationId,
    compacting,
    getConversation,
    ensureConversation,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
    deleteCurrentConversation,
    renameConversation,
    toggleConversationType,
    addExchange,
    deleteExchangeAndPrune,
    toggleExchangeIncluded,
    compactExchanges,
    updateExchange,
    appendExchangeContent,
    markExchangeDone,
    markExchangeError,
    conversationFileMap,
    getFiles,
    setFiles,
    setModel,
    setNumCtx,
    setThink,
    setStream,
    setEvent,
    setRoomId,
    setUploadedImages,
    getConversationId,
    setConversationId,
    getUploadedImagesForConversation,
    hasUploadedImageReference,
    snapshotImageSelections,
    restoreImageSelections,
    deselectAllImages,
    removeUploadedImage,
    toggleUploadedImageSelected,
    setSubscriptions,
    buildPrompt,
  };
});

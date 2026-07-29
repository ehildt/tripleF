import { defineStore } from 'pinia';
import TurndownService from 'turndown';
import { ref } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { getApiUrl } from '../api/api-url';
import {
  deleteConversation as deleteServerConversation,
  fetchConversation,
  fetchConversations,
  saveConversation as saveServerConversation,
} from '../api/conversations.api';
import { deleteUploadedObject } from '../api/storage.api';
import { clearPendingFilesForConversation } from '../composables/attached-files.state';
import type { ConversationMetadataImage } from '../utils/build-query-params.helper';
import { createId } from '../utils/id.helper';
import { calcInputTokenDelta } from './helpers/calc-input-token-delta.helper';
import { getPersistentSocketSessionId } from './helpers/get-persistent-socket-session-id.helper';
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

const SESSION_ID = getPersistentSocketSessionId();
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

function toPersistedConversation(
  conversation: Conversation,
): PersistedConversation {
  return {
    id: conversation.id,
    title: conversation.title,
    exchanges: conversation.exchanges,
    savedFileInfos: conversation.savedFileInfos,
    uploadedImages: conversation.uploadedImages,
    imageSelectionSnapshot: conversation.imageSelectionSnapshot,
    conversationId: conversation.conversationId,
    model: conversation.model,
    numCtx: conversation.numCtx,
    think: conversation.think,
    event: conversation.event,
    roomId: conversation.roomId,
    stream: conversation.stream,
    subscriptions: conversation.subscriptions,
    type: conversation.type,
    task: conversation.task,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function fromPersistedConversation(
  persisted: PersistedConversation,
): Conversation {
  return {
    ...persisted,
    files: [],
    uploadedImages: (persisted.uploadedImages ?? []).map((img) => ({
      ...img,
      selected: (img as UploadedImage).selected ?? true,
    })),
    imageSelectionSnapshot: persisted.imageSelectionSnapshot ?? {},
    subscriptions: persisted.subscriptions ?? [],
    type: persisted.type ?? 'temporary',
  } as Conversation;
}

async function loadConversations(): Promise<Conversation[]> {
  try {
    const snapshots = await fetchConversations(SESSION_ID);
    const now = Date.now();
    const loaded = await Promise.all(
      snapshots.map((snapshot) =>
        fetchConversation(SESSION_ID, snapshot.conversationId),
      ),
    );

    return loaded
      .filter((merged) => {
        let updatedAt = 0;
        if (merged.updatedAt) {
          updatedAt = new Date(merged.updatedAt).getTime();
        } else if (merged.content.updatedAt) {
          updatedAt = new Date(String(merged.content.updatedAt)).getTime();
        }
        const type = merged.content.type ?? 'temporary';
        if (type !== 'temporary') return true;
        return now - updatedAt <= TEMP_SESSION_TTL_MS;
      })
      .map((merged) =>
        fromPersistedConversation({
          ...(merged.content as unknown as PersistedConversation),
          conversationId: merged.conversationId,
        }),
      );
  } catch {
    return [];
  }
}

function getLatestRequestId(conversation: Conversation): string {
  const latest = [...conversation.exchanges].reverse().find((e) => e.requestId);
  return latest?.requestId ?? conversation.conversationId;
}

async function saveConversationToServer(conversation: Conversation) {
  try {
    const content = toPersistedConversation(conversation);
    await saveServerConversation(
      SESSION_ID,
      conversation.conversationId,
      getLatestRequestId(conversation),
      content as Record<string, unknown>,
    );
  } catch {
    // Offline — the in-memory store remains usable.
  }
}

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | null>(null);
  const compacting = ref(false);
  const hydrated = ref(false);

  loadConversations().then((loaded) => {
    conversations.value = loaded;
    hydrated.value = true;
  });

  function saveActiveConversation() {
    const id = activeConversationId.value;
    if (!id) return;
    const conversation = getConversation(id);
    if (!conversation) return;
    void saveConversationToServer(conversation);
  }

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
    const conversation = getConversation(id);
    if (!conversation) return;

    const conversationId = conversation.conversationId;
    conversations.value.splice(
      conversations.value.findIndex((s) => s.id === id),
      1,
    );
    conversationFileMap.value = Object.fromEntries(
      Object.entries(conversationFileMap.value).filter(([k]) => k !== id),
    );
    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null;
    }

    void deleteServerConversation(SESSION_ID, conversationId);
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
      void deleteServerConversation(SESSION_ID, conversationId);
    } else {
      void saveConversationToServer(conversation);
    }
  }

  function renameConversation(id: string, title: string) {
    const conversation = getConversation(id);
    if (conversation) {
      conversation.title = title;
      void saveConversationToServer(conversation);
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
    void saveConversationToServer(conversation);
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

    void saveConversationToServer(conversation);
  }

  function toggleConversationType(conversationId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    conversation.type =
      conversation.type === 'temporary' ? 'persistent' : 'temporary';
    void saveConversationToServer(conversation);
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
      .map((e) => toPromptMessage(e))
      .filter((m) => m.content.trim());

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
    void saveConversationToServer(conversation);
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
      void saveConversationToServer(conversation);
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
    void saveConversationToServer(conversation);
  }

  function getFiles(conversationId: string): File[] {
    const conversation = getConversation(conversationId);
    return (
      conversationFileMap.value[conversationId] ?? conversation?.files ?? []
    );
  }

  function setModel(conversationId: string, model: string) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.model = model;
      void saveConversationToServer(conversation);
    }
  }

  function setNumCtx(conversationId: string, numCtx: string) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.numCtx = numCtx;
      void saveConversationToServer(conversation);
    }
  }

  function setThink(conversationId: string, think: string) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.think = think;
      void saveConversationToServer(conversation);
    }
  }

  function setStream(conversationId: string, stream: boolean) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.stream = stream;
      void saveConversationToServer(conversation);
    }
  }

  function setEvent(conversationId: string, event: string) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.event = event;
      void saveConversationToServer(conversation);
    }
  }

  function setRoomId(conversationId: string, roomId: string) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.roomId = roomId;
      void saveConversationToServer(conversation);
    }
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
    if (conversation) {
      conversation.conversationId = newConversationId;
      void saveConversationToServer(conversation);
    }
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
    void saveConversationToServer(conversation);
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
    if (image) {
      image.selected = image.selected !== false ? false : true;
      void saveConversationToServer(conversation);
    }
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
    void saveConversationToServer(conversation);
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
    void saveConversationToServer(conversation);
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
    void saveConversationToServer(conversation);
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
    void saveConversationToServer(conversation);
  }

  function setSubscriptions(
    conversationId: string,
    subscriptions: ConversationSubscription[],
  ) {
    const conversation = getConversation(conversationId);
    if (conversation) {
      conversation.subscriptions = subscriptions;
      void saveConversationToServer(conversation);
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

    void saveConversationToServer(conversation);
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

  return {
    conversations,
    activeConversationId,
    compacting,
    hydrated,
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
    saveActiveConversation,
  };
});

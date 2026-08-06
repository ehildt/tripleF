import { defineStore } from 'pinia';
import TurndownService from 'turndown';
import { ref } from 'vue';

import { getApiUrl } from '../api/api-url';
import {
  type ConversationContent,
  deleteConversation as deleteServerConversation,
  fetchConversation,
  fetchConversations,
  saveConversation as saveServerConversation,
} from '../api/conversations.api';
import { deleteUploadedObject } from '../api/storage.api';
import { clearPendingFilesForConversation } from '../composables/attached-files.state';
import { createId } from '../utils/id.helper';
import { calcInputTokenDelta } from './helpers/calc-input-token-delta.helper';
import { createConversation } from './helpers/create-conversation.helper';
import { fromPersistedConversation } from './helpers/from-persisted-conversation.helper';
import { getLatestRequestId } from './helpers/get-latest-request-id.helper';
import { getPersistentSocketSessionId } from './helpers/get-persistent-socket-session-id.helper';
import { inferConversationTitle } from './helpers/infer-conversation-title.helper';
import { isTemporaryConversationExpired } from './helpers/is-temporary-conversation-expired.helper';
import { mergeUploadedImages } from './helpers/merge-uploaded-images.helper';
import { prunePairedExchange } from './helpers/prune-paired-exchange.helper';
import { toPersistedConversation } from './helpers/to-persisted-conversation.helper';
import { toPromptMessage } from './helpers/to-prompt-message.helper';
import { togglePairedExchangeIncluded } from './helpers/toggle-paired-exchange-included.helper';
import { withTemplateMarker } from './helpers/with-template-marker.helper';
import type {
  Conversation,
  ConversationSubscription,
  ConversationType,
  PersistedConversation,
  UploadedImage,
} from './conversation.model';
import { type Exchange } from './conversation.model';
import { useSocketStore } from './socket';

export type {
  Conversation,
  Exchange,
  UploadedImage,
} from './conversation.model';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

const SESSION_ID = getPersistentSocketSessionId();

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
        return !isTemporaryConversationExpired(
          merged.content.type,
          updatedAt,
          now,
        );
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

async function saveConversationToServer(conversation: Conversation) {
  try {
    const content = toPersistedConversation(conversation);
    await saveServerConversation(
      SESSION_ID,
      conversation.conversationId,
      getLatestRequestId(conversation),
      content as unknown as ConversationContent,
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
  const conversationFileMap = ref<Record<string, File[]>>({});

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
    conversation.title = inferConversationTitle(
      conversation.title,
      exchange.content,
    );
    void saveConversationToServer(conversation);
  }

  function deleteExchangeAndPrune(conversationId: string, exchangeId: string) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    const next = prunePairedExchange(conversation.exchanges, exchangeId);
    if (next === conversation.exchanges) return;
    conversation.exchanges = next;

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

  function patchConversation(
    conversationId: string,
    patch: Partial<
      Pick<
        Conversation,
        'model' | 'numCtx' | 'think' | 'stream' | 'event' | 'roomId'
      >
    >,
  ) {
    const conversation = getConversation(conversationId);
    if (!conversation) return;
    Object.assign(conversation, patch);
    void saveConversationToServer(conversation);
  }

  function setModel(conversationId: string, model: string) {
    patchConversation(conversationId, { model });
  }

  function setNumCtx(conversationId: string, numCtx: string) {
    patchConversation(conversationId, { numCtx });
  }

  function setThink(conversationId: string, think: string) {
    patchConversation(conversationId, { think });
  }

  function setStream(conversationId: string, stream: boolean) {
    patchConversation(conversationId, { stream });
  }

  function setEvent(conversationId: string, event: string) {
    patchConversation(conversationId, { event });
  }

  function setRoomId(conversationId: string, roomId: string) {
    patchConversation(conversationId, { roomId });
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
    conversation.uploadedImages = mergeUploadedImages(
      conversation.uploadedImages,
      images,
      cid,
    );
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
    const next = togglePairedExchangeIncluded(
      conversation.exchanges,
      exchangeId,
    );
    if (!next) return;
    conversation.exchanges = next;

    void saveConversationToServer(conversation);
  }

  function buildPrompt(conversationId: string): string {
    const conversation = getConversation(conversationId);
    if (!conversation) return '[]';
    const messages = conversation.exchanges
      .filter((e) => e.included !== false)
      .map((e) => {
        const message = toPromptMessage(e, { includeTemplateMarker: false });
        return {
          role: message.role,
          // The classifier marker survives only outside turndown: brackets
          // would be escaped and the newline collapsed to a space.
          content: withTemplateMarker(
            turndown.turndown(message.content),
            e.harnessTemplate,
          ),
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

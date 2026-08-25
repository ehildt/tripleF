import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import {
  deleteConversation as deleteServerConversation,
  fetchConversation,
  fetchConversations,
  saveConversation as saveServerConversation,
} from '../api/conversations.api';
import { deleteUploadedObject } from '../api/storage.api';
import { calcTotalContextPercentage } from '../components/chat/shared/helpers/calc-token-percent.helper';
import { clearPendingFilesForConversation } from '../composables/attached-files.state';
import { resolvePendingMerge } from '../composables/merge-selection.state';
import type { MergedConversation } from '../types/conversation.model';
import { createId } from '../utils/id.helper';
import { calcInputTokenDelta } from './helpers/conversation/calc-input-token-delta.helper';
import { createConversation } from './helpers/conversation/create-conversation.helper';
import { fromConversationSnapshot } from './helpers/conversation/from-conversation-snapshot.helper';
import { fromPersistedConversation } from './helpers/conversation/from-persisted-conversation.helper';
import { getLatestRequestId } from './helpers/conversation/get-latest-request-id.helper';
import { inferConversationTitle } from './helpers/conversation/infer-conversation-title.helper';
import { isTemporaryConversationExpired } from './helpers/conversation/is-temporary-conversation-expired.helper';
import { loadTurndown } from './helpers/conversation/load-turndown.helper';
import { mergeUploadedDocuments } from './helpers/conversation/merge-uploaded-documents.helper';
import { mergeUploadedImages } from './helpers/conversation/merge-uploaded-images.helper';
import { prunePairedExchange } from './helpers/conversation/prune-paired-exchange.helper';
import { toPersistedConversation } from './helpers/conversation/to-persisted-conversation.helper';
import { toPromptMessage } from './helpers/conversation/to-prompt-message.helper';
import { togglePairedExchangeIncluded } from './helpers/conversation/toggle-paired-exchange-included.helper';
import { withTemplateMarker } from './helpers/conversation/with-template-marker.helper';
import { getPersistentSocketSessionId } from './helpers/socket/get-persistent-socket-session-id.helper';
import { useAppStore } from './app';
import type {
  Conversation,
  ConversationSubscription,
  ConversationType,
  PersistedConversation,
  UploadedDocument,
  UploadedImage,
} from './conversation.model';
import { type Exchange } from './conversation.model';

export type {
  Conversation,
  Exchange,
  UploadedDocument,
  UploadedImage,
} from './conversation.model';

const SESSION_ID = getPersistentSocketSessionId();

/** localStorage key remembering the last opened conversation across reloads. */
const LAST_ACTIVE_CONVERSATION_KEY = 'last-active-conversation-id';

/** localStorage key holding unpinned (temporary) conversations. */
const TEMP_CONVERSATIONS_KEY = 'harness-temporary-conversations';

function loadTemporaryConversations(): Record<string, PersistedConversation> {
  try {
    return JSON.parse(
      localStorage.getItem(TEMP_CONVERSATIONS_KEY) || '{}',
    ) as Record<string, PersistedConversation>;
  } catch {
    return {};
  }
}

function saveTemporaryConversations(
  map: Record<string, PersistedConversation>,
) {
  try {
    localStorage.setItem(TEMP_CONVERSATIONS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Write an unpinned (temporary) conversation into localStorage. */
function persistConversationLocally(conversation: Conversation) {
  const content = toPersistedConversation(conversation);
  conversation.contextUsagePercent = content.contextUsagePercent;
  const map = loadTemporaryConversations();
  map[conversation.conversationId] = content;
  saveTemporaryConversations(map);
}

/** Remove an unpinned conversation from localStorage (when pinned or deleted). */
function removeConversationLocally(conversationId: string) {
  const map = loadTemporaryConversations();
  if (conversationId in map) {
    delete map[conversationId];
    saveTemporaryConversations(map);
  }
}

/**
 * Load persistent conversations from the server and unpinned (temporary) ones
 * from localStorage. Temporary conversations are dropped once they have sat
 * untouched past the configured retention window (0 minutes drops them all).
 */
async function loadConversations(): Promise<Conversation[]> {
  const now = Date.now();
  const retentionMs = useAppStore().temporaryRetentionMinutes * 60 * 1000;

  const persistent: Conversation[] = [];
  try {
    const snapshots = await fetchConversations(SESSION_ID);
    for (const snapshot of snapshots) {
      if (snapshot.type !== 'persistent') continue;
      persistent.push(fromConversationSnapshot(snapshot));
    }
  } catch {
    // Offline — the persistent list stays empty.
  }

  const localMap = loadTemporaryConversations();
  const temporary: Conversation[] = [];
  let pruned = false;
  for (const [conversationId, persisted] of Object.entries(localMap)) {
    if (
      isTemporaryConversationExpired(
        persisted.type,
        persisted.updatedAt,
        now,
        retentionMs,
      )
    ) {
      delete localMap[conversationId];
      pruned = true;
    } else {
      temporary.push(fromPersistedConversation(persisted));
    }
  }
  if (pruned) saveTemporaryConversations(localMap);

  return [...temporary, ...persistent];
}

/** Write a pinned (persistent) conversation to the server. */
async function saveConversationToServer(conversation: Conversation) {
  try {
    const content = toPersistedConversation(conversation);
    // Keep the in-memory value in sync with what is persisted so the sidebar
    // shows the freshly calculated context usage without a reload.
    conversation.contextUsagePercent = content.contextUsagePercent;
    await saveServerConversation(
      SESSION_ID,
      conversation.conversationId,
      getLatestRequestId(conversation),
      content,
    );
  } catch {
    // Offline — the in-memory store remains usable.
  }
}

/**
 * Persist a conversation to its correct store: the server for pinned
 * (persistent) conversations, localStorage for unpinned (temporary) ones.
 */
function persistConversation(conversation: Conversation) {
  if (conversation.type === 'persistent') {
    void saveConversationToServer(conversation);
  } else {
    persistConversationLocally(conversation);
  }
}

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | null>(null);
  const hydrated = ref(false);
  const conversationFileMap = ref<Record<string, File[]>>({});

  /**
   * Full-content fetches in flight, keyed by the stable server conversationId
   * (not the internal id). The boot restore registers under the saved id, and
   * a user click on the same conversation joins that request instead of
   * issuing a duplicate GET.
   */
  const inFlightLoads = new Map<string, Promise<boolean>>();

  // Boot: fetch the stub list (sidebar) while the last active conversation's
  // full content fetches in parallel — the saved id is known synchronously
  // from localStorage, so the chat restore never waits for the list.
  void bootstrapConversations();

  /**
   * Boot sequence: fetch the conversation stubs for the sidebar while the
   * last active conversation's full content fetches in parallel. The saved id
   * is the stable server conversationId, known synchronously from
   * localStorage, so the single-conversation fetch never waits for the list —
   * the chat renders after max(list, content) instead of their sum.
   */
  async function bootstrapConversations() {
    const savedId = localStorage.getItem(LAST_ACTIVE_CONVERSATION_KEY);
    const savedIsLocal = savedId
      ? loadTemporaryConversations()[savedId] !== undefined
      : false;

    // The list settle promise is shared with the restore apply so a fast
    // content fetch can never run ahead of the stub assignment below — the
    // apply awaits it before reading `conversations`.
    const listSettled = loadConversations().then((stubs) => {
      conversations.value = stubs;
      hydrated.value = true;
    });

    // Kick the content fetch off immediately. Temporary conversations are
    // already fully hydrated from localStorage, so a server fetch would be a
    // guaranteed 404 with nothing to gain.
    const restoreApply =
      savedId && !savedIsLocal
        ? applyRestoredConversation(
            savedId,
            fetchConversation(SESSION_ID, savedId),
            listSettled,
          )
        : null;
    if (savedId && restoreApply) inFlightLoads.set(savedId, restoreApply);

    await listSettled;

    if (!savedId) return;

    if (savedIsLocal) {
      const local = conversations.value.find(
        (c) => c.conversationId === savedId,
      );
      if (local) activeConversationId.value = local.id;
      return;
    }

    // Join the parallel restore. If a user click on the same conversation
    // already ran it (via the shared in-flight entry), there is nothing left
    // to do — the apply resolved and activated the conversation.
    const joined = inFlightLoads.get(savedId);
    if (!joined) return;
    try {
      await joined;
    } finally {
      inFlightLoads.delete(savedId);
    }
  }

  /**
   * Fetch a saved conversation's full content and apply it to the matching
   * stub once the list has settled — or insert it when the list has no match
   * (the snapshot raced a save). Resolves true when the conversation is ready
   * to use. A 404 clears a stale bookmark; a network failure keeps it for a
   * reload retry.
   */
  async function applyRestoredConversation(
    savedId: string,
    fetchPromise: Promise<MergedConversation | null>,
    listSettled: Promise<void>,
  ): Promise<boolean> {
    let merged: MergedConversation | null;
    try {
      merged = await fetchPromise;
    } catch {
      // Network failure — the conversation may still exist; the stub (if any)
      // stays lazily loadable and the bookmark is kept for a reload retry.
      await listSettled;
      const stub = conversations.value.find(
        (c) => c.conversationId === savedId,
      );
      if (stub) activeConversationId.value = stub.id;
      return false;
    }
    await listSettled;
    if (!merged) {
      // 404 — the conversation no longer exists on the server. Drop the stale
      // bookmark unless the list still shows a stub (then it stays lazily
      // openable).
      const stub = conversations.value.find(
        (c) => c.conversationId === savedId,
      );
      if (stub) activeConversationId.value = stub.id;
      else localStorage.removeItem(LAST_ACTIVE_CONVERSATION_KEY);
      return false;
    }

    const loaded = fromPersistedConversation({
      ...(merged.content as unknown as PersistedConversation),
      conversationId: merged.conversationId,
    });
    const stub = conversations.value.find((c) => c.conversationId === savedId);
    if (stub) {
      Object.assign(stub, loaded, { loaded: true });
      // Refresh the cached percentage from the freshly hydrated exchanges so
      // the sidebar fallback never shows a stale/null server value for a
      // conversation that actually has token data.
      stub.contextUsagePercent = calcTotalContextPercentage(
        stub.exchanges,
        stub.numCtx,
      );
      activeConversationId.value = stub.id;
    } else {
      conversations.value.unshift(loaded);
      activeConversationId.value = loaded.id;
    }
    return true;
  }

  /**
   * Hydrate a conversation stub with its full content from the server.
   * No-op when the conversation is already loaded or missing. Resolves true
   * when the conversation is ready to use (already loaded or just hydrated).
   * Concurrent loads of the same conversation share a single request.
   */
  async function loadConversation(id: string): Promise<boolean> {
    const conversation = getConversation(id);
    if (!conversation || conversation.loaded) return true;
    const inFlight = inFlightLoads.get(conversation.conversationId);
    if (inFlight) return inFlight;
    const promise = (async () => {
      try {
        const merged = await fetchConversation(
          SESSION_ID,
          conversation.conversationId,
        );
        if (!merged) return false; // 404 — nothing left to hydrate
        const loaded = fromPersistedConversation({
          ...(merged.content as unknown as PersistedConversation),
          conversationId: merged.conversationId,
        });
        Object.assign(conversation, loaded, { loaded: true });
        // Refresh the cached percentage from the freshly hydrated exchanges so
        // the sidebar fallback never shows a stale/null server value for a
        // conversation that actually has token data.
        conversation.contextUsagePercent = calcTotalContextPercentage(
          conversation.exchanges,
          conversation.numCtx,
        );
        return true;
      } catch {
        // Offline — the stub remains usable.
        return false;
      }
    })();
    inFlightLoads.set(conversation.conversationId, promise);
    try {
      return await promise;
    } finally {
      inFlightLoads.delete(conversation.conversationId);
    }
  }

  /**
   * Run a write against a conversation, hydrating a stub from the server first
   * so a partial save can never overwrite its stored history. Loaded
   * conversations are mutated synchronously so callers can read the result
   * immediately (e.g. setting a title/stream right after creating one).
   */
  function mutateConversation(
    id: string,
    fn: (conversation: Conversation) => void,
  ) {
    const conversation = getConversation(id);
    if (!conversation) return;
    if (!conversation.loaded) {
      void loadConversation(id).then((ok) => {
        if (ok) mutateConversation(id, fn);
      });
      return;
    }
    fn(conversation);
  }

  /**
   * Async counterpart for writes that must be awaited (e.g. delete). Returns
   * the conversation, hydrating a stub from the server first.
   */
  async function loadConversationForWrite(
    id: string,
  ): Promise<Conversation | undefined> {
    const conversation = getConversation(id);
    if (!conversation) return undefined;
    if (conversation.loaded) return conversation;
    const ok = await loadConversation(id);
    if (!ok) return undefined;
    return getConversation(id);
  }

  function saveActiveConversation() {
    const id = activeConversationId.value;
    if (!id) return;
    const conversation = getConversation(id);
    if (!conversation) return;
    void persistConversation(conversation);
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
      void loadConversation(id);
    }
  }

  // Persist the active conversation so a reload can restore it. The stable
  // server conversationId is stored, not the internal id.
  watch(activeConversationId, (id) => {
    if (!id) {
      localStorage.removeItem(LAST_ACTIVE_CONVERSATION_KEY);
      return;
    }
    const conversation = getConversation(id);
    localStorage.setItem(
      LAST_ACTIVE_CONVERSATION_KEY,
      conversation?.conversationId ?? id,
    );
  });

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

    // Always drop the local copy; only persistent conversations live on the server.
    removeConversationLocally(conversationId);
    if (conversation.type === 'persistent') {
      void deleteServerConversation(SESSION_ID, conversationId);
    }
  }

  async function deleteCurrentConversation(parentId: string) {
    const conversation = await loadConversationForWrite(parentId);
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
      // Drop the local copy too; only persistent conversations live on the server.
      removeConversationLocally(conversationId);
      if (conversation.type === 'persistent') {
        void deleteServerConversation(SESSION_ID, conversationId);
      }
    } else {
      void persistConversation(conversation);
    }
  }

  function renameConversation(id: string, title: string) {
    mutateConversation(id, (conversation) => {
      conversation.title = title;
      void persistConversation(conversation);
    });
  }

  function addExchange(
    conversationId: string,
    exchange: Omit<Exchange, 'timestamp' | 'id'>,
  ) {
    mutateConversation(conversationId, (conversation) => {
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
      void persistConversation(conversation);
    });
  }

  function deleteExchangeAndPrune(conversationId: string, exchangeId: string) {
    mutateConversation(conversationId, (conversation) => {
      const next = prunePairedExchange(conversation.exchanges, exchangeId);
      if (next === conversation.exchanges) return;
      conversation.exchanges = next;

      void persistConversation(conversation);
    });
  }

  function toggleConversationType(conversationId: string) {
    mutateConversation(conversationId, (conversation) => {
      const nextType: ConversationType =
        conversation.type === 'temporary' ? 'persistent' : 'temporary';
      conversation.type = nextType;

      if (nextType === 'persistent') {
        // Unpinned → pinned: leave localStorage and persist on the server.
        removeConversationLocally(conversation.conversationId);
        void saveConversationToServer(conversation);
      } else {
        // Pinned → unpinned: drop from the server and keep only locally.
        void deleteServerConversation(SESSION_ID, conversation.conversationId);
        persistConversationLocally(conversation);
      }
    });
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
    mutateConversation(conversationId, (conversation) => {
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

      // A completed merge finalizes its sources: the exchanges consolidated
      // into this unified response become excluded (dropped from future
      // prompts) and marked as merged-away (purple). Only once the response
      // actually arrived, so a failed or canceled merge leaves the
      // originals untouched and retryable. The pending merge selection
      // resolves at the same time: the source icons stop pulsing and switch
      // to the consumed (red) state.
      const pairUser = conversation.exchanges.find(
        (e) => e.role === 'user' && e.requestId === requestId,
      );
      if (pairUser?.mergeOrigin?.length) {
        const originRequestIds = new Set(pairUser.mergeOrigin);
        const sourceExchangeIds: string[] = [];
        for (const source of conversation.exchanges) {
          if (source.requestId && originRequestIds.has(source.requestId)) {
            source.included = false;
            source.mergedInto = requestId;
            sourceExchangeIds.push(source.id);
          }
        }
        resolvePendingMerge(conversationId, requestId, sourceExchangeIds);
      }

      conversation.updatedAt = Date.now();
      void persistConversation(conversation);
    });
  }

  function markExchangeError(
    conversationId: string,
    requestId: string,
    errorMessage?: string,
  ) {
    mutateConversation(conversationId, (conversation) => {
      const exchange = conversation.exchanges.find(
        (e) => e.requestId === requestId && e.role === 'assistant',
      );
      if (exchange) {
        exchange.status = 'error';
        if (errorMessage) exchange.content = errorMessage;
        conversation.updatedAt = Date.now();
        void persistConversation(conversation);
      }

      // A failed merge resolves its pending selection without consuming the
      // sources: the icons stop pulsing and the originals stay included so
      // the user can re-select and retry.
      const failedPairUser = conversation.exchanges.find(
        (e) => e.role === 'user' && e.requestId === requestId,
      );
      if (failedPairUser?.mergeOrigin?.length) {
        const originRequestIds = new Set(failedPairUser.mergeOrigin);
        const sourceExchangeIds = conversation.exchanges
          .filter((e) => e.requestId && originRequestIds.has(e.requestId))
          .map((e) => e.id);
        resolvePendingMerge(conversationId, requestId, sourceExchangeIds);
      }
    });
  }

  function setFiles(conversationId: string, newFiles: File[]) {
    mutateConversation(conversationId, (conversation) => {
      conversationFileMap.value = {
        ...conversationFileMap.value,
        [conversationId]: newFiles,
      };
      conversation.files = newFiles;
      conversation.savedFileInfos = newFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      }));
      void persistConversation(conversation);
    });
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
    mutateConversation(conversationId, (conversation) => {
      Object.assign(conversation, patch);
      void persistConversation(conversation);
    });
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
    mutateConversation(conversationId, (conversation) => {
      conversation.conversationId = newConversationId;
      void persistConversation(conversation);
    });
  }

  function setUploadedImages(conversationId: string, images: UploadedImage[]) {
    mutateConversation(conversationId, (conversation) => {
      const cid = getConversationId(conversationId);
      conversation.uploadedImages = mergeUploadedImages(
        conversation.uploadedImages,
        images,
        cid,
      );
      void persistConversation(conversation);
    });
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
    mutateConversation(conversationId, (conversation) => {
      const cid = targetConversationId ?? getConversationId(conversationId);
      const image = conversation.uploadedImages.find(
        (img) => img.hash === hash && (img.conversationId ?? cid) === cid,
      );
      if (image) {
        image.selected = image.selected !== false ? false : true;
        void persistConversation(conversation);
      }
    });
  }

  function snapshotImageSelections(conversationId: string) {
    mutateConversation(conversationId, (conversation) => {
      const cid = getConversationId(conversationId);
      const snapshot: Record<string, boolean> = {};
      for (const img of conversation.uploadedImages) {
        if ((img.conversationId ?? cid) !== cid) continue;
        snapshot[img.hash] = img.selected !== false;
      }
      conversation.imageSelectionSnapshot = snapshot;
      void persistConversation(conversation);
    });
  }

  function restoreImageSelections(conversationId: string) {
    mutateConversation(conversationId, (conversation) => {
      if (Object.keys(conversation.imageSelectionSnapshot).length === 0) {
        return;
      }
      const cid = getConversationId(conversationId);
      for (const img of conversation.uploadedImages) {
        if ((img.conversationId ?? cid) !== cid) continue;
        const saved = conversation.imageSelectionSnapshot[img.hash];
        if (saved !== undefined) {
          img.selected = saved;
        }
      }
      void persistConversation(conversation);
    });
  }

  function deselectAllImages(conversationId: string) {
    mutateConversation(conversationId, (conversation) => {
      const cid = getConversationId(conversationId);
      for (const img of conversation.uploadedImages) {
        if ((img.conversationId ?? cid) === cid) {
          img.selected = false;
        }
      }
      void persistConversation(conversation);
    });
  }

  function removeUploadedImage(
    conversationId: string,
    hash: string,
    targetConversationId?: string,
  ) {
    mutateConversation(conversationId, (conversation) => {
      const cid = targetConversationId ?? getConversationId(conversationId);
      conversation.uploadedImages = conversation.uploadedImages.filter(
        (img) => !(img.hash === hash && (img.conversationId ?? cid) === cid),
      );
      void persistConversation(conversation);
    });
  }

  function setUploadedDocuments(
    conversationId: string,
    documents: UploadedDocument[],
  ) {
    mutateConversation(conversationId, (conversation) => {
      const cid = getConversationId(conversationId);
      conversation.uploadedDocuments = mergeUploadedDocuments(
        conversation.uploadedDocuments,
        documents,
        cid,
      );
      void persistConversation(conversation);
    });
  }

  function getUploadedDocumentsForConversation(
    conversationId: string,
    targetConversationId?: string,
  ): UploadedDocument[] {
    const conversation = getConversation(conversationId);
    if (!conversation) return [];
    const cid = targetConversationId ?? getConversationId(conversationId);
    return conversation.uploadedDocuments.filter(
      (doc) => (doc.conversationId ?? cid) === cid,
    );
  }

  function toggleUploadedDocumentSelected(
    conversationId: string,
    hash: string,
    targetConversationId?: string,
  ) {
    mutateConversation(conversationId, (conversation) => {
      const cid = targetConversationId ?? getConversationId(conversationId);
      const document = conversation.uploadedDocuments.find(
        (doc) => doc.hash === hash && (doc.conversationId ?? cid) === cid,
      );
      if (document) {
        document.selected = document.selected !== false ? false : true;
        void persistConversation(conversation);
      }
    });
  }

  function removeUploadedDocument(
    conversationId: string,
    hash: string,
    targetConversationId?: string,
  ) {
    mutateConversation(conversationId, (conversation) => {
      const cid = targetConversationId ?? getConversationId(conversationId);
      conversation.uploadedDocuments = conversation.uploadedDocuments.filter(
        (doc) => !(doc.hash === hash && (doc.conversationId ?? cid) === cid),
      );
      void persistConversation(conversation);
    });
  }

  function setSubscriptions(
    conversationId: string,
    subscriptions: ConversationSubscription[],
  ) {
    mutateConversation(conversationId, (conversation) => {
      conversation.subscriptions = subscriptions;
      void persistConversation(conversation);
    });
  }

  function toggleExchangeIncluded(conversationId: string, exchangeId: string) {
    mutateConversation(conversationId, (conversation) => {
      const next = togglePairedExchangeIncluded(
        conversation.exchanges,
        exchangeId,
      );
      if (!next) return;
      conversation.exchanges = next;

      void persistConversation(conversation);
    });
  }

  /**
   * Build the model-facing prompt for a conversation. Async since the markdown
   * converter loads on demand (see load-turndown.helper).
   */
  async function buildPrompt(conversationId: string): Promise<string> {
    const conversation = getConversation(conversationId);
    if (!conversation) return '[]';
    // Turndown is only needed at submit time, so it loads on demand instead
    // of weighing down the boot chunk graph.
    const turndown = await loadTurndown();
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
    setUploadedDocuments,
    getUploadedDocumentsForConversation,
    toggleUploadedDocumentSelected,
    removeUploadedDocument,
    setSubscriptions,
    buildPrompt,
    saveActiveConversation,
  };
});

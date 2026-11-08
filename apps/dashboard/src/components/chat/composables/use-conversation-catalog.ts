import { watch } from 'vue';

import { fetchConversation } from '@/api/conversations.api';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import { i18n } from '@/i18n/i18n';
import type {
  Conversation,
  ConversationType,
  PersistedConversation,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { fromPersistedConversation } from '@/stores/chat/conversation/helpers/from-persisted-conversation.helper';
import { useConversationSettingsStore } from '@/stores/chat/conversation-settings/conversation-settings.store';
import type { MergedConversation } from '@/types/conversation.model';
import { createId } from '@/utils/create-id/create-id.helper';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

const SESSION_ID = getPersistentSocketSessionId();
const LAST_ACTIVE_CONVERSATION_KEY = 'last-active-conversation-id';

/** Full-content loads are joined across every catalog consumer. */
const inFlightLoads = new Map<string, Promise<boolean>>();

interface ConversationCatalog {
  bootstrapConversations: () => Promise<void>;
  watchActiveConversationBookmark: () => void;
  loadConversation: (conversationStoreId: string) => Promise<boolean>;
  loadConversationForWrite: (
    conversationStoreId: string,
  ) => Promise<Conversation | undefined>;
  ensureConversation: () => Conversation;
  createNewConversation: (
    type?: ConversationType,
    event?: string,
    roomId?: string,
    initial?: Partial<Conversation>,
  ) => Conversation;
  restoreConversation: (conversation: Conversation) => Conversation;
  setActiveConversation: (conversationStoreId: string) => void;
  renameConversation: (
    conversationStoreId: string,
    title: string,
  ) => Promise<void>;
  toggleConversationType: (conversationStoreId: string) => Promise<void>;
}

/** Own catalog I/O, restore/load coordination, creation, and pin workflows. */
export function useConversationCatalog(): ConversationCatalog {
  const conversationStore = useConversationStore();
  const persistence = useConversationPersistence();

  function activateRestoredConversation(
    conversation: Conversation | undefined,
  ): void {
    if (conversation) {
      conversationStore.activateRestoredConversation(conversation.id);
    }
  }

  async function applyRestoredConversation(
    savedId: string,
    fetchPromise: Promise<MergedConversation | null>,
    listSettled: Promise<void>,
  ): Promise<boolean> {
    let merged: MergedConversation | null;
    try {
      merged = await fetchPromise;
    } catch {
      await listSettled;
      const stub = conversationStore.conversations.find(
        (conversation) => conversation.conversationId === savedId,
      );
      activateRestoredConversation(stub);
      return false;
    }
    await listSettled;
    if (!merged) {
      const stub = conversationStore.conversations.find(
        (conversation) => conversation.conversationId === savedId,
      );
      if (stub) {
        activateRestoredConversation(stub);
      } else {
        localStorage.removeItem(LAST_ACTIVE_CONVERSATION_KEY);
      }
      return false;
    }

    const loaded = fromPersistedConversation({
      ...(merged.content as unknown as PersistedConversation),
      conversationId: merged.conversationId,
    });
    activateRestoredConversation(
      conversationStore.applyLoadedConversation(savedId, loaded),
    );
    return true;
  }

  async function bootstrapConversations(): Promise<void> {
    const savedId = localStorage.getItem(LAST_ACTIVE_CONVERSATION_KEY);
    const listSettled = persistence
      .loadConversations(
        useConversationSettingsStore().temporaryRetentionMinutes,
      )
      .then((stubs) => {
        conversationStore.mergeConversationStubs(stubs);
      });

    const savedIsLocal = savedId
      ? (await persistence.loadTemporaryConversation(savedId)) !== undefined
      : false;
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
      activateRestoredConversation(
        conversationStore.conversations.find(
          (conversation) => conversation.conversationId === savedId,
        ),
      );
      return;
    }

    const joined = inFlightLoads.get(savedId);
    if (!joined) return;
    try {
      await joined;
    } finally {
      inFlightLoads.delete(savedId);
    }
  }

  function watchActiveConversationBookmark(): void {
    watch(
      () => conversationStore.activeConversationId,
      (id) => {
        if (!id) {
          localStorage.removeItem(LAST_ACTIVE_CONVERSATION_KEY);
          return;
        }
        const conversation = conversationStore.getConversation(id);
        localStorage.setItem(
          LAST_ACTIVE_CONVERSATION_KEY,
          conversation?.conversationId ?? id,
        );
      },
    );
  }

  async function loadConversation(
    conversationStoreId: string,
  ): Promise<boolean> {
    const conversation = conversationStore.getConversation(conversationStoreId);
    if (!conversation || conversation.loaded) return true;
    const inFlight = inFlightLoads.get(conversation.conversationId);
    if (inFlight) return inFlight;
    const promise = (async () => {
      try {
        const merged = await fetchConversation(
          SESSION_ID,
          conversation.conversationId,
        );
        if (!merged) return false;
        const loaded = fromPersistedConversation({
          ...(merged.content as unknown as PersistedConversation),
          conversationId: merged.conversationId,
        });
        conversationStore.applyLoadedConversation(
          conversation.conversationId,
          loaded,
        );
        return true;
      } catch {
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

  async function loadConversationForWrite(
    conversationStoreId: string,
  ): Promise<Conversation | undefined> {
    const conversation = conversationStore.getConversation(conversationStoreId);
    if (!conversation) return undefined;
    if (conversation.loaded) return conversation;
    const ok = await loadConversation(conversationStoreId);
    if (!ok) return undefined;
    return conversationStore.getConversation(conversationStoreId);
  }

  function ensureConversation(): Conversation {
    const existing = conversationStore.activeConversationId
      ? conversationStore.getConversation(
          conversationStore.activeConversationId,
        )
      : undefined;
    if (existing) return existing;

    const conversationId = createId();
    const conversation = createConversation(
      i18n.global.t('common.newConversation'),
      {
        type: 'temporary',
        event: conversationId,
        conversationId,
      },
    );
    conversationStore.insertConversation(conversation, true);
    void persistence.persistConversation(conversation);
    return conversation;
  }

  function createNewConversation(
    type: ConversationType = 'temporary',
    event?: string,
    roomId?: string,
    initial: Partial<Conversation> = {},
  ): Conversation {
    const conversation = createConversation(
      i18n.global.t('common.newConversation'),
      {
        ...initial,
        type,
        event: event || createId(),
        roomId: roomId || '',
      },
    );
    conversationStore.insertConversation(conversation, true);
    void persistence.persistConversation(conversation);
    return conversation;
  }

  function restoreConversation(conversation: Conversation): Conversation {
    const existing = conversationStore.conversations.find(
      (candidate) => candidate.conversationId === conversation.conversationId,
    );
    if (existing) return existing;
    conversationStore.insertConversation(conversation, false);
    void persistence.persistConversation(conversation);
    return conversation;
  }

  function setActiveConversation(conversationStoreId: string): void {
    conversationStore.selectConversation(conversationStoreId);
    void loadConversation(conversationStoreId);
  }

  function renameConversation(
    conversationStoreId: string,
    title: string,
  ): Promise<void> {
    const apply = (conversation: Conversation) => {
      conversationStore.renameConversation(conversationStoreId, title);
      return persistence.persistConversation(conversation);
    };
    const current = conversationStore.getConversation(conversationStoreId);
    if (current?.loaded) return apply(current);
    return loadConversationForWrite(conversationStoreId).then(
      (conversation) => {
        if (conversation) return apply(conversation);
      },
    );
  }

  function toggleConversationType(conversationStoreId: string): Promise<void> {
    const apply = (conversation: Conversation) => {
      const nextType =
        conversation.type === 'temporary' ? 'persistent' : 'temporary';
      conversationStore.setConversationType(conversationStoreId, nextType);
      if (nextType === 'persistent') {
        void persistence.removeConversationLocally(conversation.conversationId);
      } else {
        void persistence.deletePersistentConversation(
          conversation.conversationId,
        );
      }
      return persistence.persistConversation(conversation);
    };
    const current = conversationStore.getConversation(conversationStoreId);
    if (current?.loaded) return apply(current);
    return loadConversationForWrite(conversationStoreId).then(
      (conversation) => {
        if (conversation) return apply(conversation);
      },
    );
  }

  return {
    bootstrapConversations,
    watchActiveConversationBookmark,
    loadConversation,
    loadConversationForWrite,
    ensureConversation,
    createNewConversation,
    restoreConversation,
    setActiveConversation,
    renameConversation,
    toggleConversationType,
  };
}

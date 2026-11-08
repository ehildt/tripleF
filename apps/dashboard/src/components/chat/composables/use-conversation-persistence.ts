import {
  deleteConversation,
  fetchConversations,
  saveConversation,
} from '@/api/conversations.api';
import type {
  Conversation,
  PersistedConversation,
} from '@/stores/chat/conversation/conversation.model';
import { fromConversationSnapshot } from '@/stores/chat/conversation/helpers/from-conversation-snapshot.helper';
import { fromPersistedConversation } from '@/stores/chat/conversation/helpers/from-persisted-conversation.helper';
import { getLatestRequestId } from '@/stores/chat/conversation/helpers/get-latest-request-id.helper';
import { isTemporaryConversationExpired } from '@/stores/chat/conversation/helpers/is-temporary-conversation-expired.helper';
import { toPersistedConversation } from '@/stores/chat/conversation/helpers/to-persisted-conversation.helper';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

import { temporaryConversationsDb } from './persistence/temporary-conversations.db';

const SESSION_ID = getPersistentSocketSessionId();

interface PersistenceOperation {
  run: () => Promise<unknown>;
  coalesceSave: boolean;
  onError?: (error: unknown) => void;
}

interface PersistenceChannel {
  pending: PersistenceOperation[];
  tail: Promise<void>;
}

/** One ordered channel per stable conversation id, shared by every caller. */
const channels = new Map<string, PersistenceChannel>();

function reportLocalFailure(action: string, error: unknown): void {
  console.warn(`Failed to ${action}:`, error);
}

async function drainConversationWrites(
  conversationId: string,
  channel: PersistenceChannel,
): Promise<void> {
  while (channel.pending.length > 0) {
    const operation = channel.pending.shift()!;
    try {
      await operation.run();
    } catch (error) {
      operation.onError?.(error);
    }
  }
  if (channels.get(conversationId) === channel) {
    channels.delete(conversationId);
  }
}

function enqueueConversationWrite(
  conversationId: string,
  operation: PersistenceOperation,
): Promise<void> {
  const existing = channels.get(conversationId);
  if (existing) {
    const last = existing.pending.at(-1);
    if (operation.coalesceSave && last?.coalesceSave) {
      existing.pending[existing.pending.length - 1] = operation;
    } else {
      existing.pending.push(operation);
    }
    return existing.tail;
  }

  const channel: PersistenceChannel = {
    pending: [operation],
    tail: Promise.resolve(),
  };
  channels.set(conversationId, channel);
  channel.tail = drainConversationWrites(conversationId, channel);
  return channel.tail;
}

async function loadTemporaryConversations(): Promise<PersistedConversation[]> {
  try {
    return await temporaryConversationsDb.temporaryConversations.toArray();
  } catch (error) {
    reportLocalFailure('load temporary conversations', error);
    return [];
  }
}

interface ConversationPersistence {
  loadConversations: (retentionMinutes: number) => Promise<Conversation[]>;
  loadTemporaryConversation: (
    conversationId: string,
  ) => Promise<PersistedConversation | undefined>;
  persistConversation: (conversation: Conversation) => Promise<void>;
  removeConversationLocally: (conversationId: string) => Promise<void>;
  deletePersistentConversation: (conversationId: string) => Promise<void>;
  whenConversationPersistenceSettled: (conversationId: string) => Promise<void>;
}

/** Own conversation storage I/O, write ordering, and local retention policy. */
export function useConversationPersistence(): ConversationPersistence {
  async function loadConversations(
    retentionMinutes: number,
  ): Promise<Conversation[]> {
    const now = Date.now();
    const retentionMs = retentionMinutes * 60 * 1000;
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

    const temporary: Conversation[] = [];
    const expiredIds: string[] = [];
    for (const persisted of await loadTemporaryConversations()) {
      if (
        isTemporaryConversationExpired(
          persisted.type,
          persisted.updatedAt,
          now,
          retentionMs,
        )
      ) {
        expiredIds.push(persisted.conversationId);
      } else {
        temporary.push(fromPersistedConversation(persisted));
      }
    }
    if (expiredIds.length) {
      void temporaryConversationsDb.temporaryConversations
        .bulkDelete(expiredIds)
        .catch((error: unknown) => {
          reportLocalFailure('prune expired temporary conversations', error);
        });
    }

    return [...temporary, ...persistent];
  }

  async function loadTemporaryConversation(
    conversationId: string,
  ): Promise<PersistedConversation | undefined> {
    return temporaryConversationsDb.temporaryConversations
      .get(conversationId)
      .catch(() => undefined);
  }

  function persistConversation(conversation: Conversation): Promise<void> {
    // Capture a plain snapshot synchronously: later reactive mutations must
    // not change this write, and Dexie must never receive Vue proxies.
    const content = toPersistedConversation(conversation);
    conversation.contextUsagePercent = content.contextUsagePercent;
    const requestId = getLatestRequestId(conversation);
    const type = conversation.type;
    return enqueueConversationWrite(conversation.conversationId, {
      coalesceSave: true,
      run: async () => {
        if (type === 'persistent') {
          await saveConversation(
            SESSION_ID,
            content.conversationId,
            requestId,
            content,
          );
          return;
        }
        try {
          await temporaryConversationsDb.temporaryConversations.put(content);
        } catch (error) {
          reportLocalFailure('persist temporary conversation', error);
        }
      },
    });
  }

  function removeConversationLocally(conversationId: string): Promise<void> {
    return enqueueConversationWrite(conversationId, {
      coalesceSave: false,
      run: async () => {
        await temporaryConversationsDb.temporaryConversations.delete(
          conversationId,
        );
      },
      onError: (error) =>
        reportLocalFailure('remove temporary conversation', error),
    });
  }

  function deletePersistentConversation(conversationId: string): Promise<void> {
    return enqueueConversationWrite(conversationId, {
      coalesceSave: false,
      run: () => deleteConversation(SESSION_ID, conversationId),
    });
  }

  async function whenConversationPersistenceSettled(
    conversationId: string,
  ): Promise<void> {
    await channels.get(conversationId)?.tail;
  }

  return {
    loadConversations,
    loadTemporaryConversation,
    persistConversation,
    removeConversationLocally,
    deletePersistentConversation,
    whenConversationPersistenceSettled,
  };
}

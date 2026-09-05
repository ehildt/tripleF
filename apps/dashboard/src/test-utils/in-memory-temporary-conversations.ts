import type { PersistedConversation } from '@/stores/conversation.model';

/**
 * In-memory stand-in for the Dexie `temporaryConversations` table used in
 * jsdom specs (jsdom has no IndexedDB). Rows are stored JSON-serialized so
 * writes/reads are detached copies, mirroring IndexedDB's structured clone —
 * later in-place mutations of a persisted row cannot leak into the store.
 *
 * Real IndexedDB behavior (round-trip, quotas, transactions) is covered by
 * `stores/helpers/conversation/temporary-conversations.db.browser.spec.ts`
 * running in real Chromium via the browser test project.
 */
export interface InMemoryTemporaryConversationsTable {
  toArray(): Promise<PersistedConversation[]>;
  get(conversationId: string): Promise<PersistedConversation | undefined>;
  put(conversation: PersistedConversation): Promise<string>;
  delete(conversationId: string): Promise<void>;
  bulkDelete(conversationIds: string[]): Promise<void>;
  /** Test-only: drop every persisted row. */
  clear(): void;
  /** Test-only: raw persisted map keyed by conversationId, for assertions. */
  snapshot(): Record<string, PersistedConversation>;
}

function createInMemoryTemporaryConversationsTable(): InMemoryTemporaryConversationsTable {
  const rows = new Map<string, string>();

  function read(conversationId: string): PersistedConversation | undefined {
    const raw = rows.get(conversationId);
    return raw === undefined
      ? undefined
      : (JSON.parse(raw) as PersistedConversation);
  }

  return {
    toArray: async () => [...rows.values()].map((raw) => JSON.parse(raw)),
    get: async (conversationId) => read(conversationId),
    put: async (conversation) => {
      rows.set(conversation.conversationId, JSON.stringify(conversation));
      return conversation.conversationId;
    },
    delete: async (conversationId) => {
      rows.delete(conversationId);
    },
    bulkDelete: async (conversationIds) => {
      for (const conversationId of conversationIds) rows.delete(conversationId);
    },
    clear: () => rows.clear(),
    snapshot: () =>
      Object.fromEntries(
        [...rows.entries()].map(([key, raw]) => [key, JSON.parse(raw)]),
      ),
  };
}

/** Singleton shared by the global vi.mock and spec assertions. */
export const inMemoryTemporaryConversationsTable =
  createInMemoryTemporaryConversationsTable();

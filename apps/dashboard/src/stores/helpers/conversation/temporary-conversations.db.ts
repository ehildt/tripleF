import { Dexie, type Table } from 'dexie';

import type { PersistedConversation } from '../../conversation.model';

/**
 * IndexedDB store for unpinned (temporary) conversations. The whole map never
 * lives in a single record: each conversation is its own row keyed by
 * conversationId, so saving one conversation never rewrites the others, and
 * the payload is not bound by the ~5 MiB Web Storage quota (IndexedDB uses
 * the per-origin quota, measured in GiB).
 *
 * Pinned (persistent) conversations live on the server and never touch this
 * table. The table is a best-effort local cache: writes are fire-and-forget
 * (callers keep working from the in-memory store) and a failed open (private
 * browsing, blocked storage) degrades to "no temporary conversations
 * persisted" instead of breaking the app.
 */
export const temporaryConversationsDb = new Dexie('triplef') as Dexie & {
  temporaryConversations: Table<PersistedConversation, string>;
};

temporaryConversationsDb.version(1).stores({
  temporaryConversations: 'conversationId',
});

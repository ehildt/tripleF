import { Dexie, type Table } from 'dexie';

import type { PersistedConversation } from '@/stores/chat/conversation/conversation.model';

/** IndexedDB rows for temporary conversations, keyed by stable conversation id. */
export const temporaryConversationsDb = new Dexie('triplef') as Dexie & {
  temporaryConversations: Table<PersistedConversation, string>;
};

temporaryConversationsDb.version(1).stores({
  temporaryConversations: 'conversationId',
});

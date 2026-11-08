import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-total-context-percentage.helper';

import type {
  Conversation,
  Exchange,
  PersistedConversation,
} from '../conversation.model';

/**
 * Project an in-memory conversation into the shape stored on the server.
 * Pending browser file handles live in the attachment store; only their
 * metadata survives here via `savedFileInfos`.
 *
 * The result must be a PLAIN snapshot: reading fields off the reactive store
 * object returns nested reactive proxies, and IndexedDB (Dexie `put`,
 * structured clone) rejects those with `DataCloneError: [object Array] could
 * not be cloned` — the localStorage→IndexedDB migration regressed on exactly
 * this because `JSON.stringify` tolerates proxies while structuredClone does
 * not. A JSON round-trip unwraps every level; all persisted fields are
 * JSON-safe (numbers/strings/booleans/plain objects).
 */
/**
 * The server-owned wire spelling of an exchange: the assistant response
 * payload persists under `harnessData` / `harnessTemplate`, which the client
 * model names `responseData` / `responseTemplate`.
 */
type PersistedExchange = Omit<Exchange, 'responseData' | 'responseTemplate'> & {
  harnessData?: Exchange['responseData'];
  harnessTemplate?: string;
};

/** Rename the client model fields onto the server-owned wire keys. */
function toPersistedExchange(exchange: Exchange): PersistedExchange {
  const { responseData, responseTemplate, ...rest } = exchange;
  return {
    ...rest,
    harnessData: responseData,
    harnessTemplate: responseTemplate,
  };
}

export function toPersistedConversation(
  conversation: Conversation,
): PersistedConversation {
  const persisted = {
    id: conversation.id,
    title: conversation.title,
    exchanges: conversation.exchanges.map(toPersistedExchange),
    savedFileInfos: conversation.savedFileInfos,
    uploadedImages: conversation.uploadedImages,
    uploadedDocuments: conversation.uploadedDocuments,
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
    // Stored so the sidebar can show context usage without loading the full
    // conversation. Recalculated on every save (prompt add/delete/numCtx …).
    contextUsagePercent: calcTotalContextPercentage(
      conversation.exchanges,
      conversation.numCtx,
    ),
  };
  return JSON.parse(JSON.stringify(persisted)) as PersistedConversation;
}

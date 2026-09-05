import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-token-percent.helper';

import type {
  Conversation,
  PersistedConversation,
} from '../../conversation.model';

/**
 * Project an in-memory conversation into the shape stored on the server:
 * everything except the transient `File` handles, which cannot be
 * serialized. The file metadata survives via `savedFileInfos`.
 *
 * The result must be a PLAIN snapshot: reading fields off the reactive store
 * object returns nested reactive proxies, and IndexedDB (Dexie `put`,
 * structured clone) rejects those with `DataCloneError: [object Array] could
 * not be cloned` — the localStorage→IndexedDB migration regressed on exactly
 * this because `JSON.stringify` tolerates proxies while structuredClone does
 * not. A JSON round-trip unwraps every level; all persisted fields are
 * JSON-safe (numbers/strings/booleans/plain objects).
 */
export function toPersistedConversation(
  conversation: Conversation,
): PersistedConversation {
  const persisted = {
    id: conversation.id,
    title: conversation.title,
    exchanges: conversation.exchanges,
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

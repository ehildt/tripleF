import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-token-percent.helper';

import type {
  Conversation,
  PersistedConversation,
} from '../../conversation.model';

/**
 * Project an in-memory conversation into the shape stored on the server:
 * everything except the transient `File` handles, which cannot be
 * serialized. The file metadata survives via `savedFileInfos`.
 */
export function toPersistedConversation(
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
    // Stored so the sidebar can show context usage without loading the full
    // conversation. Recalculated on every save (prompt add/delete/numCtx …).
    contextUsagePercent: calcTotalContextPercentage(
      conversation.exchanges,
      conversation.numCtx,
    ),
  };
}

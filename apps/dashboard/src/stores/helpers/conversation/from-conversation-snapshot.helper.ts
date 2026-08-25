import type { ConversationSnapshot } from '../../../types/conversation.model';
import type { Conversation } from '../../conversation.model';

/**
 * Build a lightweight conversation stub from a server snapshot. Only the
 * metadata needed by the sidebar (title, expiry, socket binding, type, and
 * the stored context-usage percentage) is populated — the full content
 * (exchanges, files, images) stays empty until the conversation is opened
 * and `loadConversation` hydrates it.
 */
export function fromConversationSnapshot(
  snapshot: ConversationSnapshot,
): Conversation {
  const now = Date.now();
  return {
    id: snapshot.id ?? snapshot.conversationId,
    title: snapshot.title ?? '(untitled)',
    exchanges: [],
    files: [],
    savedFileInfos: [],
    uploadedImages: [],
    uploadedDocuments: [],
    imageSelectionSnapshot: {},
    conversationId: snapshot.conversationId,
    model: '',
    numCtx: snapshot.numCtx ?? '',
    think: 'medium',
    event: snapshot.event ?? '',
    roomId: snapshot.roomId ?? '',
    stream: snapshot.stream ?? true,
    subscriptions: snapshot.subscriptions ?? [],
    type: snapshot.type ?? 'temporary',
    contextUsagePercent: snapshot.contextUsagePercent ?? null,
    createdAt: now,
    updatedAt: new Date(snapshot.updatedAt ?? now).getTime(),
    loaded: false,
  };
}

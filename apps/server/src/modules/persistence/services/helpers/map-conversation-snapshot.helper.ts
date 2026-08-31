import type { ConversationSnapshot } from '../conversation.service.types.js';

type ConversationTurnRow = {
  conversationId: string;
  title?: string | null;
  updatedAt?: Date;
  content: unknown;
};

/** Project a latest-turn row into the conversation snapshot shape. */
export function mapConversationSnapshot(
  turn: ConversationTurnRow,
): ConversationSnapshot {
  const content = (turn.content ?? {}) as Record<string, unknown>;
  return {
    id: typeof content.id === 'string' ? content.id : turn.conversationId,
    conversationId: turn.conversationId,
    title: turn.title,
    updatedAt: turn.updatedAt,
    type: (content.type as ConversationSnapshot['type']) ?? 'temporary',
    event: content.event as string | undefined,
    roomId: content.roomId as string | undefined,
    numCtx: content.numCtx as string | undefined,
    stream: content.stream as boolean | undefined,
    subscriptions: content.subscriptions as
      ConversationSnapshot['subscriptions'] | undefined,
    contextUsagePercent:
      typeof content.contextUsagePercent === 'string'
        ? content.contextUsagePercent
        : null,
  };
}

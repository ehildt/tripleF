import { createId } from '../../utils/id.helper';
import type { Conversation } from '../conversation.model';

/**
 * Build a fresh in-memory conversation with all defaults applied. Only the
 * listed fields may be overridden via `partial` — ids and timestamps are
 * always generated.
 */
export function createConversation(
  partial?: Partial<Conversation>,
): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: 'New Conversation',
    exchanges: [],
    files: [],
    savedFileInfos: [],
    uploadedImages: partial?.uploadedImages ?? [],
    imageSelectionSnapshot: partial?.imageSelectionSnapshot ?? {},
    conversationId: partial?.conversationId ?? createId(),
    model: partial?.model ?? '',
    numCtx: partial?.numCtx ?? '',
    think: partial?.think ?? 'medium',
    event: partial?.event ?? '',
    roomId: partial?.roomId ?? '',
    stream: partial?.stream ?? true,
    subscriptions: partial?.subscriptions ?? [],
    type: partial?.type ?? 'temporary',
    createdAt: now,
    updatedAt: now,
  };
}

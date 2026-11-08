import { createId } from '@/utils/create-id/create-id.helper';

import type { Conversation } from '../conversation.model';

/**
 * Build a fresh in-memory conversation with all defaults applied. Only the
 * listed fields may be overridden via `partial` — ids and timestamps are
 * always generated.
 */
export function createConversation(
  defaultTitle: string,
  partial?: Partial<Conversation>,
): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: partial?.title ?? defaultTitle,
    exchanges: partial?.exchanges ?? [],
    savedFileInfos: [],
    uploadedImages: partial?.uploadedImages ?? [],
    uploadedDocuments: partial?.uploadedDocuments ?? [],
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
    task: partial?.task,
    contextUsagePercent: null,
    loaded: true,
    createdAt: now,
    updatedAt: now,
  };
}

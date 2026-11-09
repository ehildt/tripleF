import type { PendingAttachmentScope } from '../attached-files.store.types';

/** Build the collision-safe JSON-tuple key for one pending attachment scope. */
export function buildPendingFilesKey(scope: PendingAttachmentScope): string {
  return JSON.stringify([scope.parentConversationId, scope.conversationId]);
}

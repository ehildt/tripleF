import type { ConversationType } from '../../conversation.model';

/**
 * Temporary conversations expire once they have not been touched for the
 * configured retention window. A retention of 0 (or negative) means temporary
 * conversations expire immediately. Persistent conversations never expire.
 */
export function isTemporaryConversationExpired(
  type: ConversationType | undefined,
  updatedAtMs: number,
  nowMs: number,
  retentionMs: number,
): boolean {
  if ((type ?? 'temporary') !== 'temporary') return false;
  if (retentionMs <= 0) return true;
  return nowMs - updatedAtMs > retentionMs;
}

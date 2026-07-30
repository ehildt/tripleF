import type { ConversationType } from '../conversation.model';

const TEMP_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Temporary conversations are dropped from hydration once they have not
 * been touched for a week. Persistent conversations never expire.
 */
export function isTemporaryConversationExpired(
  type: ConversationType | undefined,
  updatedAtMs: number,
  nowMs: number,
): boolean {
  if ((type ?? 'temporary') !== 'temporary') return false;
  return nowMs - updatedAtMs > TEMP_SESSION_TTL_MS;
}

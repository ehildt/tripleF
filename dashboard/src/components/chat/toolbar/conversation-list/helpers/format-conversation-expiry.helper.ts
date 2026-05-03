import { formatDistanceToNow } from 'date-fns';

/** Seven days in milliseconds — the TTL for temporary conversations. */
const TEMP_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Format a temporary conversation's expiry as a relative time string.
 * Example: "expires in 3 days"
 */
export function formatConversationExpiry(updatedAt: number): string {
  return formatDistanceToNow(updatedAt + TEMP_SESSION_TTL_MS, {
    addSuffix: true,
  });
}

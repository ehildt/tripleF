import { formatDistanceToNow } from 'date-fns';

/**
 * Format a temporary conversation's expiry as a relative time string, based on
 * the configured retention window (in minutes).
 * Example: "expires in 3 days"
 */
export function formatConversationExpiry(
  updatedAt: number,
  retentionMinutes: number,
): string {
  const retentionMs = Math.max(0, retentionMinutes) * 60 * 1000;
  return formatDistanceToNow(updatedAt + retentionMs, {
    addSuffix: true,
  });
}

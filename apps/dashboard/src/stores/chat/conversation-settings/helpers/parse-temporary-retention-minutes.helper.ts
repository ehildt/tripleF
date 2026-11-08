import { DEFAULT_TEMPORARY_RETENTION_MINUTES } from '../conversation-settings.constant';

/** Parse the persisted temporary-conversation retention, preserving the
 * seven-day default for missing or invalid values and allowing zero. */
export function parseTemporaryRetentionMinutes(raw: string | null): number {
  // `Number(null)` is 0 — an absent key must use the default instead.
  if (raw === null) return DEFAULT_TEMPORARY_RETENTION_MINUTES;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_TEMPORARY_RETENTION_MINUTES;
}

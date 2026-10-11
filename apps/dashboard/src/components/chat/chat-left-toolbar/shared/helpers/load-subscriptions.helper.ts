import type { SubscriptionEntry } from '@/types/subscription.model';

/**
 * Read the persisted socket subscriptions stored under the given key,
 * returning an empty list when the value is missing or cannot be parsed.
 */
export function loadSubscriptions(storageKey: string): SubscriptionEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

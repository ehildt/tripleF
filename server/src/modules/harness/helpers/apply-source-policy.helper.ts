import type { SourcesConfig } from '../../provider-overrides/configs/sources-config.adapter.js';

import { hostnameOf, matchesDomain } from './matches-domain.helper.js';

/** URL-ish fields, in priority order — the first present one decides. */
const URL_FIELDS = [
  'url',
  'link',
  'imageUrl',
  'videoUrl',
  'sourcePageUrl',
] as const;

/**
 * Apply the dynamic source policy to extracted tool data:
 * - blocked domains: entries are dropped entirely, and any URL inside a
 *   surviving entry that points at a blocked host is blanked (media fields
 *   can reference proxies even when the article itself lives elsewhere);
 * - preferred domains: surviving entries are stably partitioned so
 *   preferred hosts surface first without reshuffling the rest.
 */
export function applySourcePolicy<T extends object>(
  items: T[],
  sources: SourcesConfig | undefined,
): T[] {
  const preferred = (sources?.preferred ?? []).filter(Boolean);
  const blocked = (sources?.blocked ?? []).filter(Boolean);
  if (preferred.length === 0 && blocked.length === 0) return items;

  let result = items;

  if (blocked.length > 0) {
    result = result
      .filter((item) => {
        const host = primaryHost(asRecord(item));
        return !host || !blocked.some((domain) => matchesDomain(host, domain));
      })
      .map((item) => blankBlockedUrls(item, blocked));
  }

  if (preferred.length > 0) {
    const preferredItems: T[] = [];
    const rest: T[] = [];
    for (const item of result) {
      const host = primaryHost(asRecord(item));
      if (host && preferred.some((domain) => matchesDomain(host, domain))) {
        preferredItems.push(item);
      } else {
        rest.push(item);
      }
    }
    result = [...preferredItems, ...rest];
  }

  return result;
}

function asRecord(item: object): Record<string, unknown> {
  return item as Record<string, unknown>;
}

/** Host of the first URL-ish field present on the item ("" when none). */
function primaryHost(item: Record<string, unknown>): string {
  for (const field of URL_FIELDS) {
    const value = item[field];
    if (typeof value === 'string' && value) return hostnameOf(value);
  }
  return '';
}

/** Blank URL fields that point at a blocked host. */
function blankBlockedUrls<T extends object>(item: T, blocked: string[]): T {
  const copy = { ...item } as Record<string, unknown>;
  let mutated = false;
  for (const [key, value] of Object.entries(copy)) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) continue;
    if (blocked.some((domain) => matchesDomain(value, domain))) {
      copy[key] = '';
      mutated = true;
    }
  }
  return mutated ? (copy as T) : item;
}

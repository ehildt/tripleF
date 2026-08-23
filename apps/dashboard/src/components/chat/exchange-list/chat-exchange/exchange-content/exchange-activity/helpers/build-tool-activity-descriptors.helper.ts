import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import type { ActiveToolCall } from './build-tool-activity-descriptors.helper.types';

/** Tool categories with a dedicated `activity.*` translation key. Anything
 *  else falls back to the generic "executing {tool}" label. */
const KNOWN_CATEGORY_KEYS: Record<string, string> = {
  web: 'activity.web',
  images: 'activity.images',
  videos: 'activity.videos',
  news: 'activity.news',
  shopping: 'activity.shopping',
  reviews: 'activity.reviews',
  places: 'activity.places',
  fetch: 'activity.fetch',
  reference: 'activity.reference',
  variants: 'activity.variants',
  market: 'activity.market',
};

const MAX_QUERY_LENGTH = 48;

function truncateQuery(query: string): string {
  return query.length > MAX_QUERY_LENGTH
    ? `${query.slice(0, MAX_QUERY_LENGTH).trimEnd()}…`
    : query;
}

/**
 * Build one activity descriptor per running tool-call category — never a
 * chained "category · category" label. Parallel calls in the same category
 * collapse into a single descriptor carrying the source count, and a uniform
 * search query is attached as meta so the client can localize it. The client
 * cycles through the returned descriptors one at a time.
 */
export function buildToolActivityDescriptors(
  toolCalls: ActiveToolCall[],
): HarnessActivityDescriptor[] {
  if (!toolCalls.length) return [];

  const byCategory = new Map<string, ActiveToolCall[]>();
  for (const call of toolCalls) {
    const category = call.category ?? 'other';
    byCategory.set(category, [...(byCategory.get(category) ?? []), call]);
  }

  const descriptors: HarnessActivityDescriptor[] = [];
  for (const [category, calls] of byCategory) {
    const query = calls[0].query;
    const hasUniformQuery =
      Boolean(query) && calls.every((c) => c.query === query);
    const count = calls.length;

    if (category in KNOWN_CATEGORY_KEYS) {
      descriptors.push({
        key: KNOWN_CATEGORY_KEYS[category],
        meta: {
          query: hasUniformQuery && query ? truncateQuery(query) : undefined,
          count,
        },
      });
    } else {
      descriptors.push({
        key: 'activity.executingTool',
        meta: { tool: calls[0].name, count },
      });
    }
  }

  return descriptors;
}

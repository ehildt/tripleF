export interface ActiveToolCall {
  name: string;
  category?: string;
  query?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  web: 'Searching the web',
  images: 'Finding images',
  videos: 'Finding videos',
  news: 'Finding news',
  shopping: 'Finding product offers',
  reviews: 'Reading reviews',
  places: 'Finding places',
  fetch: 'Reading the page',
  reference: 'Searching references',
  variants: 'Enhancing images',
};

const MAX_QUERY_LENGTH = 48;

function truncateQuery(query: string): string {
  return query.length > MAX_QUERY_LENGTH
    ? `${query.slice(0, MAX_QUERY_LENGTH).trimEnd()}…`
    : query;
}

function resolveCategoryLabel(calls: ActiveToolCall[]): string {
  const category = calls[0].category ?? 'other';
  return CATEGORY_LABELS[category] ?? `Executing ${calls[0].name}`;
}

/**
 * Build a single activity label for the currently running tool calls.
 * Parallel calls in the same category are grouped into one label with a
 * source count, and a uniform search query is woven into the label so the
 * user sees what is being looked up.
 */
export function buildToolActivityLabel(toolCalls: ActiveToolCall[]): string {
  if (!toolCalls.length) return '';

  const byCategory = new Map<string, ActiveToolCall[]>();
  for (const call of toolCalls) {
    const category = call.category ?? 'other';
    byCategory.set(category, [...(byCategory.get(category) ?? []), call]);
  }

  if (byCategory.size === 1) {
    const calls = [...byCategory.values()][0];
    const base = resolveCategoryLabel(calls);
    const countSuffix = calls.length > 1 ? ` (${calls.length} sources)` : '';
    const query = calls[0].query;
    const hasUniformQuery =
      Boolean(query) && calls.every((c) => c.query === query);

    if (query && hasUniformQuery) {
      return `${base} for "${truncateQuery(query)}"${countSuffix}…`;
    }
    return `${base}${countSuffix}…`;
  }

  const parts = [...byCategory.values()].map((calls) => {
    const base = resolveCategoryLabel(calls);
    return calls.length > 1 ? `${base} (${calls.length})` : base;
  });
  return `${parts.join(' · ')}…`;
}

/**
 * Anchors freshness-relevant search queries on the current date so search
 * engines bias toward recent results. Only news searches get the full date
 * ("28 July 2026") — they are inherently time-sensitive. Generic searches
 * (web/image/video) are intentionally NOT date-anchored here: research shows
 * blanket year injection (a) biases against evergreen results, (b) hardcodes
 * the current calendar year even when prior-year content is more abundant,
 * and (c) overrides the model's own per-query freshness decisions. Those
 * searches leave recency to the model, guided by the execute prompt and each
 * tool's `recency` parameter (day/week/month/year).
 *
 * Identity lookups are excluded on purpose: places/reviews queries name a
 * business, fetches target a specific URL, and the shopping tool explicitly
 * wants the bare product name — appending dates would corrupt those lookups.
 * Timeless requests opt out entirely via intent.getDate=false (checked by
 * the caller).
 */
const NEWS_ONLY_TOOL = /newssearch/i;
/** Tools whose queries must never be date-anchored. */
const DATE_APPEND_EXCLUDED = /placessearch|reviewssearch|shoppingsearch|fetch/i;

/** Query-string fields the date anchor may be appended to. */
const QUERY_FIELDS = ['query', 'text'] as const;

export function applySearchRecency<T>(
  toolName: string,
  input: T,
  now = new Date(),
): T {
  if (!input || typeof input !== 'object') return input;
  if (!NEWS_ONLY_TOOL.test(toolName)) return input;
  if (DATE_APPEND_EXCLUDED.test(toolName)) return input;

  const anchor = formatToday(now);

  const record = input as Record<string, unknown>;
  for (const field of QUERY_FIELDS) {
    const value = record[field];
    if (typeof value !== 'string' || !value.trim()) continue;
    if (value.endsWith(anchor)) continue;
    record[field] = `${value.trimEnd()} ${anchor}`;
    return input;
  }
  return input;
}

/** "28 July 2026" — an unambiguous, locale-independent English date. */
function formatToday(now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
}

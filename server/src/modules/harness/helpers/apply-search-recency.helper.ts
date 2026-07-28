/**
 * Anchors freshness-relevant search queries on the current date so search
 * engines bias toward recent results. News searches get the full date
 * ("28 July 2026"), other searches a year anchor ("2026").
 *
 * Identity lookups are excluded on purpose: places/reviews queries name a
 * business, fetches target a specific URL, and the shopping tool explicitly
 * wants the bare product name — appending dates would corrupt those lookups.
 * Timeless requests opt out entirely via intent.getDate=false (checked by
 * the caller).
 */
const DATE_APPENABLE_TOOL = /news|search/i;
const DATE_APPEND_EXCLUDED = /placessearch|reviewssearch|shoppingsearch|fetch/i;

/** Query-string fields the date anchor may be appended to. */
const QUERY_FIELDS = ['query', 'text'] as const;

export function applySearchRecency<T>(
  toolName: string,
  input: T,
  now = new Date(),
): T {
  if (!input || typeof input !== 'object') return input;
  if (!DATE_APPENABLE_TOOL.test(toolName)) return input;
  if (DATE_APPEND_EXCLUDED.test(toolName)) return input;

  const anchor = /newssearch/i.test(toolName)
    ? formatToday(now)
    : String(now.getFullYear());

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

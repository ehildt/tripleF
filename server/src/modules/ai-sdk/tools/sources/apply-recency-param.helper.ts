/**
 * Google quick-date-range filter for Serper: maps a recency window to the
 * `tbs` `qdr:*` token (past day/week/month/year). Serper forwards `tbs`
 * verbatim to Google, so the same tokens work for web, news, images, and
 * videos. Appends to an existing `tbs` value (e.g. the image size filter)
 * instead of overwriting it.
 */
export type SearchRecency = keyof typeof QDR_BY_RECENCY;

const QDR_BY_RECENCY: Record<'day' | 'week' | 'month' | 'year', string> = {
  day: 'qdr:d',
  week: 'qdr:w',
  month: 'qdr:m',
  year: 'qdr:y',
};

export function applyRecencyParam(
  body: Record<string, unknown>,
  recency?: SearchRecency,
): void {
  if (!recency) return;
  const qdr = QDR_BY_RECENCY[recency];
  const existing = typeof body.tbs === 'string' ? body.tbs : '';
  body.tbs = existing ? `${existing},${qdr}` : qdr;
}

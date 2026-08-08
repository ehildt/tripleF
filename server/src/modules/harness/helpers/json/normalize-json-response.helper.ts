/**
 * Deduplicate gallery arrays by a URL/key field, keeping the first occurrence.
 */
function dedupeGalleryItems(
  value: unknown,
  key: string,
): unknown[] | undefined {
  const arr = normalizeArray(value, (entry) => coerceToUrlObject(entry, key));
  if (!arr) return undefined;

  const seen = new Set<string>();
  return arr.filter((item) => {
    const url = (item as Record<string, unknown>)?.[key];
    if (typeof url !== 'string') return true;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/**
 * Light normalization for LLM-generated structured JSON.
 *
 * Vision and general-purpose models often emit array entries as plain strings
 * instead of the required objects (e.g. ["finding"] instead of
 * [{"text":"finding"}]). This helper coerces those entries into the expected
 * shape before Zod validation, reducing noisy retries while preserving real
 * data.
 */

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeArray(
  value: unknown,
  map: (entry: unknown) => unknown | undefined,
): unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map(map)
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);
}

function coerceToObject(entry: unknown): Record<string, unknown> | undefined {
  if (entry === null || entry === undefined) return undefined;

  if (isNonEmptyString(entry)) {
    return { text: entry.trim() };
  }

  if (typeof entry === 'object' && !Array.isArray(entry)) {
    return entry as Record<string, unknown>;
  }

  return undefined;
}

function coerceToSource(
  entry: unknown,
  requireTitle: boolean,
): Record<string, unknown> | undefined {
  if (entry === null || entry === undefined) return undefined;

  if (isNonEmptyString(entry)) {
    const trimmed = entry.trim();
    if (!looksLikeUrl(trimmed)) return undefined;
    return requireTitle ? { url: trimmed, title: '' } : { url: trimmed };
  }

  if (typeof entry === 'object' && !Array.isArray(entry)) {
    const obj = entry as Record<string, unknown>;
    if (requireTitle && !obj.title) {
      return { ...obj, title: '' };
    }
    return obj;
  }

  return undefined;
}

function coerceToUrlObject(
  entry: unknown,
  key: string,
): Record<string, unknown> | undefined {
  if (entry === null || entry === undefined) return undefined;

  if (isNonEmptyString(entry)) {
    const trimmed = entry.trim();
    if (!looksLikeUrl(trimmed)) return undefined;
    return { [key]: trimmed };
  }

  if (typeof entry === 'object' && !Array.isArray(entry)) {
    return entry as Record<string, unknown>;
  }

  return undefined;
}

/**
 * Numeric-string rescue for scores: local models often emit scores as
 * strings ("7.5"). An uncoercible score is dropped instead of failing the
 * schema — a missing rating renders better than a retry loop.
 */
function coerceToNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (!isNonEmptyString(value)) return undefined;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Evaluation subject profile: bare strings become `{ name }` entries, and
 * nested strengths/weaknesses get the same text-item coercion as their
 * top-level counterparts.
 */
function coerceToSubject(entry: unknown): Record<string, unknown> | undefined {
  if (isNonEmptyString(entry)) return { name: entry.trim() };
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return undefined;
  }
  const subject = { ...(entry as Record<string, unknown>) };
  normalizeField(subject, 'strengths', coerceToObject);
  normalizeField(subject, 'weaknesses', coerceToObject);
  if (subject.score !== undefined) {
    const score = coerceToNumber(subject.score);
    if (score === undefined) delete subject.score;
    else subject.score = score;
  }
  return subject;
}

/** Comparison matrix cell: a `{ subject, score }` entry with number coercion. */
function coerceToCriterionScore(
  entry: unknown,
): Record<string, unknown> | undefined {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return undefined;
  }
  const scoreEntry = { ...(entry as Record<string, unknown>) };
  const score = coerceToNumber(scoreEntry.score);
  if (score === undefined) return undefined;
  scoreEntry.score = score;
  return scoreEntry;
}

/** Comparison matrix row: bare strings become `{ name }` entries. */
function coerceToCriterion(
  entry: unknown,
): Record<string, unknown> | undefined {
  if (isNonEmptyString(entry)) return { name: entry.trim() };
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return undefined;
  }
  const criterion = { ...(entry as Record<string, unknown>) };
  normalizeField(criterion, 'scores', coerceToCriterionScore);
  return criterion;
}

/** Comparison block: a bare string becomes the summary. */
function coerceToComparison(
  value: unknown,
): Record<string, unknown> | undefined {
  if (isNonEmptyString(value)) return { summary: value.trim() };
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const comparison = { ...(value as Record<string, unknown>) };
  normalizeField(comparison, 'criteria', coerceToCriterion);
  return comparison;
}

function normalizeField(
  parsed: Record<string, unknown>,
  field: string,
  mapper: (entry: unknown) => unknown | undefined,
): void {
  const value = parsed[field];
  if (value === undefined) return;

  const normalized = normalizeArray(value, mapper);
  if (normalized !== undefined) {
    parsed[field] = normalized;
  }
}

/**
 * Normalizes common LLM output mistakes in structured response JSON.
 *
 * The function mutates and returns the parsed object so callers can pass it
 * straight to schema validation.
 */
export function normalizeJsonResponse(
  parsed: Record<string, unknown>,
  template: string,
): Record<string, unknown> {
  const normalized = { ...parsed };

  // Text findings / points
  normalizeField(normalized, 'keyFindings', coerceToObject);
  normalizeField(normalized, 'keyPoints', coerceToObject);

  // Product text entries (pros/cons share the { text } shape)
  normalizeField(normalized, 'pros', coerceToObject);
  normalizeField(normalized, 'cons', coerceToObject);

  // Evaluation lists share the same { text } shape
  normalizeField(normalized, 'strengths', coerceToObject);
  normalizeField(normalized, 'weaknesses', coerceToObject);
  normalizeField(normalized, 'recommendations', coerceToObject);

  // Evaluation subject profiles and the closing comparison block
  normalizeField(normalized, 'subjects', coerceToSubject);
  if (normalized.comparison !== undefined) {
    const comparison = coerceToComparison(normalized.comparison);
    if (comparison) normalized.comparison = comparison;
    else delete normalized.comparison;
  }

  // Sources (news requires a title)
  normalizeField(normalized, 'sources', (entry) =>
    coerceToSource(entry, template === 'news'),
  );

  // Media gallery items
  const galleryItems = dedupeGalleryItems(normalized.galleryItems, 'imageUrl');
  if (galleryItems !== undefined) {
    normalized.galleryItems = galleryItems;
  }

  const videoGalleryItems = dedupeGalleryItems(
    normalized.videoGalleryItems,
    'videoUrl',
  );
  if (videoGalleryItems !== undefined) {
    normalized.videoGalleryItems = videoGalleryItems;
  }

  // News-specific arrays
  normalizeField(normalized, 'relatedStories', (entry) =>
    coerceToSource(entry, true),
  );

  // Article cards
  normalizeField(normalized, 'cards', (entry) =>
    coerceToUrlObject(entry, 'url'),
  );

  return normalized;
}

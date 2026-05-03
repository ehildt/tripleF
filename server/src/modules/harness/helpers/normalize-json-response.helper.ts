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

  // Sources (news requires a title)
  normalizeField(normalized, 'sources', (entry) =>
    coerceToSource(entry, template === 'news'),
  );

  // Media gallery items
  normalizeField(normalized, 'galleryItems', (entry) =>
    coerceToUrlObject(entry, 'imageUrl'),
  );
  normalizeField(normalized, 'videoGalleryItems', (entry) =>
    coerceToUrlObject(entry, 'videoUrl'),
  );

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

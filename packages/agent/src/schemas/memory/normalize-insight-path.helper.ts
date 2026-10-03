/**
 * One canonical path segment: lowercase, dash-joined — the formatting shared
 * by insight-path normalization (write side) and profile-path flattening
 * (probe side), so a path emitted by the profile job always matches the path
 * derived from the profile document.
 */
function normalizePathSegment(segment: string): string {
  return segment.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Normalize a model-authored insight path (`field.keyword`) into the
 * canonical probe key format: lowercase segments, dashes for spaces — the
 * same formatting flattenProfilePaths applies to profile values, so
 * `likes.software engineering` still matches the profile-derived
 * `likes.software-engineering`. Malformed paths (no `field.keyword` shape)
 * are dropped: the insight text still stores, only the routing key goes.
 */
export function normalizeInsightPath(path: string | undefined): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;
  const dot = trimmed.indexOf('.');
  if (dot <= 0) return undefined;
  const field = normalizePathSegment(trimmed.slice(0, dot));
  const keyword = normalizePathSegment(trimmed.slice(dot + 1));
  if (!field || !keyword) return undefined;
  return `${field}.${keyword}`;
}

/**
 * One canonical path segment: lowercase, dash-joined — the formatting shared
 * by insight-path normalization (write side, in the memory app) and
 * profile-path flattening (probe side, here), so a path emitted by the
 * profile job always matches the path derived from the profile document.
 */
export function normalizePathSegment(segment: string): string {
  return segment.trim().toLowerCase().replace(/\s+/g, '-');
}

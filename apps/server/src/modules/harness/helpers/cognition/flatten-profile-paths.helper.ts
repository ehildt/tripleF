import { normalizePathSegment } from './normalize-path-segment.helper.js';

/**
 * Flatten a cognition profile into routable path entries — the probe triggers.
 * Only topic-carrying fields participate (likes/dislikes/interests/expertise/
 * goals/preferences values): identity fields (name, language, timezone) and
 * style descriptors (communication.*) would false-match ordinary prompts.
 * Path format mirrors the profile job's insight paths: `field.keyword`
 * ("likes.cars") or `field.key` for preferences ("preferences.ui"). Segments
 * share normalizePathSegment with the write side, so a profile-derived path
 * always matches a normalized insight path.
 */
export function flattenProfilePaths(
  profile: Record<string, unknown>,
): Array<{ path: string; value: string }> {
  const entries: Array<{ path: string; value: string }> = [];
  const fields = ['likes', 'dislikes', 'interests', 'expertise', 'goals'];
  for (const field of fields) {
    const values = profile[field];
    if (!Array.isArray(values)) continue;
    for (const value of values) {
      if (typeof value !== 'string' || !value.trim()) continue;
      const keyword = normalizePathSegment(value);
      entries.push({ path: `${field}.${keyword}`, value: value.trim() });
    }
  }
  const preferences = profile.preferences;
  if (preferences && typeof preferences === 'object') {
    for (const [key, value] of Object.entries(
      preferences as Record<string, unknown>,
    )) {
      if (typeof value !== 'string' || !value.trim()) continue;
      entries.push({
        path: `preferences.${normalizePathSegment(key)}`,
        value: value.trim(),
      });
    }
  }
  return entries;
}

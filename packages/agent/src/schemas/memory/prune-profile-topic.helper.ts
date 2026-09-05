import { type MemoryCognitionProfile, normalizeInsightPath } from './memory-cognition.model.js';

/**
 * Targeted cognition delete — the profile half. Prunes ONE standing topic
 * from the structured profile document by its routing path
 * (`field.keyword`, e.g. "likes.jazz"): array facets drop the matching
 * value, record facets drop the matching key. Matching compares in the
 * canonical probe format (lowercase, dash-joined — the same formatting
 * normalizeInsightPath applies on the write side and profile-path
 * flattening applies on the probe side), so a model-authored path lands on
 * the stored value exactly the way the respond-time probe does. Scalar and
 * nested facets (name, persona, communication, …) are deliberately not
 * pruneable here — clearing those stays a profile-patch or whole-space
 * concern.
 */

const PRUNEABLE_ARRAY_FIELDS = ['expertise', 'goals', 'likes', 'dislikes', 'interests', 'convictions'] as const;
type PruneableArrayField = (typeof PRUNEABLE_ARRAY_FIELDS)[number];

const PRUNEABLE_RECORD_FIELDS = ['preferences', 'corrections'] as const;
type PruneableRecordField = (typeof PRUNEABLE_RECORD_FIELDS)[number];

const isPruneableArrayField = (field: string): field is PruneableArrayField =>
  (PRUNEABLE_ARRAY_FIELDS as readonly string[]).includes(field);
const isPruneableRecordField = (field: string): field is PruneableRecordField =>
  (PRUNEABLE_RECORD_FIELDS as readonly string[]).includes(field);

/** The canonical probe-key comparison form (same rule as normalizePathSegment). */
const toProbeKey = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '-');

export interface PruneProfileTopicOutcome {
  /** The pruned document — the SAME reference when nothing matched, so callers persist only on a hit. */
  profile: MemoryCognitionProfile;
  /** The stored value/key that was removed — undefined when the path matched nothing. */
  removed?: string;
}

export function pruneProfileTopic(profile: MemoryCognitionProfile, path: string): PruneProfileTopicOutcome {
  const normalized = normalizeInsightPath(path);
  if (!normalized) return { profile };
  const dot = normalized.indexOf('.');
  const field = normalized.slice(0, dot);
  const keyword = normalized.slice(dot + 1);

  if (isPruneableArrayField(field)) {
    const values = profile[field];
    const match = values?.find((value) => toProbeKey(value) === keyword);
    if (!values || !match) return { profile };
    const remaining = values.filter((value) => value !== match);
    return {
      // An emptied facet goes away entirely — the merge/store layers treat an
      // absent key as "removed", and normalizeCognitionProfile strips noise.
      profile: { ...profile, [field]: remaining.length > 0 ? remaining : undefined },
      removed: match,
    };
  }

  if (isPruneableRecordField(field)) {
    const record = profile[field];
    const key = record ? Object.keys(record).find((candidate) => toProbeKey(candidate) === keyword) : undefined;
    if (!record || !key) return { profile };
    const remaining = Object.fromEntries(Object.entries(record).filter(([candidate]) => candidate !== key));
    return {
      profile: { ...profile, [field]: Object.keys(remaining).length > 0 ? remaining : undefined },
      removed: key,
    };
  }

  return { profile };
}

import { merge, omit } from '@ehildt/ckir-helpers/object-io';
import { z } from 'zod';

/**
 * The AI's structured cognition of the user — the "profile" half of the
 * memory_cognition space. One living JSON document per cognition key, grown
 * by the memoryProfile queue job with PATCHES merged over it in code
 * (mergeCognitionProfiles): fields a patch omits survive, fields set to null
 * are removed, everything else replaces (arrays wholesale). Stable identity
 * and durable traits only, never task content or one-off moods (research:
 * ~90% of useful cognition entries are durable desires/intentions, not
 * transient state). Every field is NULLISH, so a null patch value is an
 * explicit DELETE — the model omits fields it is not changing and nothing
 * stored survives unless the merge says so; normalizeCognitionProfile
 * strips residual noise (empty strings/arrays) before store.
 */
const nullishText = z.string().nullish();
const nullishTopics = z.array(z.string()).nullish();

const memoryCognitionProfileSchema = z.object({
  /** The user's name or preferred handle, when known. */
  name: nullishText,
  /** Primary conversation language (BCP-47-ish, e.g. "en", "de"). */
  language: nullishText,
  /** Coarse location the user works from (IANA name or city), when known. */
  timezone: nullishText,
  /** Demonstrated skills and domains (e.g. ["TypeScript", "NestJS"]). */
  expertise: nullishTopics,
  /** Active goals and aspirations — the most durable cognition there is. */
  goals: nullishTopics,
  /** How the user wants to be answered. */
  communication: z
    .object({
      style: nullishText,
      detailLevel: nullishText,
      formality: nullishText,
    })
    .nullish(),
  /** Tooling / environment / format preferences (free-form key-value). */
  preferences: z.record(z.string(), z.string()).nullish(),
  likes: nullishTopics,
  dislikes: nullishTopics,
  /** Topics the user keeps returning to. */
  interests: nullishTopics,
});

export type MemoryCognitionProfile = z.infer<
  typeof memoryCognitionProfileSchema
>;

/**
 * Lean-up pass for model-authored profiles: drops nullish fields, empty
 * strings, empty arrays and empty objects so the stored document stays a
 * dense routing map. Returns undefined when nothing survives — an all-empty
 * verdict is a no-change answer.
 */
function normalizeCognitionProfile(
  profile: MemoryCognitionProfile | null | undefined,
): MemoryCognitionProfile | undefined {
  if (!profile) return undefined;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profile)) {
    const kept = cleanProfileValue(value);
    if (kept !== undefined) cleaned[key] = kept;
  }
  return Object.keys(cleaned).length > 0
    ? (cleaned as MemoryCognitionProfile)
    : undefined;
}

/** Clean one profile field value; undefined means "drop this field". */
function cleanProfileValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    const items = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value !== 'object') return undefined;
  const inner = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, cleanProfileScalar(v)])
      .filter(([, v]) => v !== undefined),
  );
  return Object.keys(inner).length > 0 ? inner : undefined;
}

/** Clean a scalar inside a sub-object (communication / preferences). */
function cleanProfileScalar(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  return undefined;
}

/** Outcome of resolving a model-authored patch over the stored profile document. */
interface MergedCognitionProfile {
  /** The document to persist; undefined when the patch yields no effective change (skip the write). */
  profile?: MemoryCognitionProfile;
  /** Top-level fields the patch deleted (null-valued keys) — surfaced for logging. */
  removals: string[];
}

/**
 * Resolve one memoryProfile verdict patch over the stored document — the
 * model emits deltas, never the whole JSON:
 * - fields the patch omits → kept as stored;
 * - fields set to null → removed (the patch's deletion list);
 * - everything else → replaces the stored value (deep-merged for the nested
 *   communication/preferences documents; arrays are replaced wholesale, so
 *   the patch re-emits a COMPLETE array when it touches one).
 *
 * The stored document arrives as the PARSED object (the Postgres row) — a
 * previously-unparseable stored text could silently empty the merge base;
 * the object form removes that failure mode entirely. Returns no profile
 * when the patch produces no effective change (boring turn) — the caller
 * keeps the existing document. `removals` is surfaced for observability,
 * and an all-removals patch that empties the document honestly yields {} —
 * explicit deletions are never swallowed by a "nothing survived" verdict
 * (callers protect against accidental all-null wipes via
 * isAllFieldsNullWipe).
 */
export function mergeCognitionProfiles(
  current: MemoryCognitionProfile | undefined,
  patch: MemoryCognitionProfile,
): MergedCognitionProfile {
  const patchRecord = patch as Record<string, unknown>;
  const removals = Object.keys(patchRecord).filter(
    (key) => patchRecord[key] === null || patchRecord[key] === undefined,
  ) as Array<keyof MemoryCognitionProfile>;
  const base = current ?? {};
  const merged = merge(
    omit(base, removals) as MemoryCognitionProfile,
    omit(patch, removals) as MemoryCognitionProfile,
    true,
  );
  const profile = normalizeCognitionProfile(merged) ?? {};
  const before = normalizeCognitionProfile(base) ?? {};
  const changed = JSON.stringify(profile) !== JSON.stringify(before);
  return { profile: changed ? profile : undefined, removals };
}

/**
 * True when a patch would null out EVERY stored top-level field with no
 * replacement values — the accidental "forget everything" wipe. Explicit
 * forget turns run through the memory (memoryDelete) tool, which empties
 * the document first, so a full null-wipe that still reaches the merge
 * means the model mis-read "omit unchanged fields" as "reset the document"
 * — the caller keeps the stored document and logs instead of storing {}.
 */
export function isAllFieldsNullWipe(
  current: MemoryCognitionProfile | undefined,
  patch: MemoryCognitionProfile,
): boolean {
  if (!current) return false;
  const currentKeys = Object.keys(current);
  if (currentKeys.length === 0) return false;
  const patchRecord = patch as Record<string, unknown>;
  const presentKeys = Object.keys(patchRecord);
  if (presentKeys.length === 0) return false;
  const nullKeys = presentKeys.filter(
    (key) => patchRecord[key] === null || patchRecord[key] === undefined,
  );
  // The patch carries only deletions, and they cover every stored field.
  return (
    nullKeys.length === presentKeys.length &&
    currentKeys.every((key) => nullKeys.includes(key))
  );
}

/** Tolerant read of a stored document — anything unparseable starts from scratch. */
export function parseStoredProfile(
  text: string | undefined,
): MemoryCognitionProfile {
  if (!text?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as MemoryCognitionProfile)
      : {};
  } catch {
    return {};
  }
}

/**
 * One derived insight the profile job may emit. `path` routes it back to the
 * profile facet it deepens — dot-joined `field.keyword` (e.g. `likes.cars`) —
 * so the respond-time probe can sharpen its search when the prompt touches
 * that facet. Pathless insights stay general.
 */
const memoryProfileInsightSchema = z.object({
  text: z.string(),
  path: z.string().optional(),
});

export type MemoryProfileInsight = z.infer<typeof memoryProfileInsightSchema>;

/**
 * One canonical path segment: lowercase, dash-joined — the formatting shared
 * by insight-path normalization (write side) and profile-path flattening
 * (probe side), so a path emitted by the profile job always matches the path
 * derived from the profile document.
 */
export function normalizePathSegment(segment: string): string {
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
export function normalizeInsightPath(
  path: string | undefined,
): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;
  const dot = trimmed.indexOf('.');
  if (dot <= 0) return undefined;
  const field = normalizePathSegment(trimmed.slice(0, dot));
  const keyword = normalizePathSegment(trimmed.slice(dot + 1));
  if (!field || !keyword) return undefined;
  return `${field}.${keyword}`;
}

/**
 * The memoryProfile job's structured verdict. `profile: null` means the turn
 * taught nothing new about the user (the existing document stays — the
 * replacement for the old UNCHANGED sentinel); `insights` carries new
 * derived, topic-specific understanding stored as separate probed records.
 * Bare insight strings are tolerated and coerced — small models emit both.
 */
export const memoryProfileResponseSchema = z.object({
  profile: memoryCognitionProfileSchema.nullish(),
  insights: z
    .array(
      z.union([
        z.string().transform((text) => ({ text })),
        memoryProfileInsightSchema,
      ]),
    )
    .max(8)
    .nullish()
    .transform((value) => value ?? []),
});

export type MemoryProfileResponse = z.infer<typeof memoryProfileResponseSchema>;

/** Tag marking a probed insight record of a cognition space. */
export const INSIGHT_TAGS = ['cognition', 'insight'];

/** Memory profile serialized size limits — env baseline MEMORY_COGNITION_LIMIT. */
export const COGNITION_LIMIT_DEFAULT = 5000;
export const COGNITION_LIMIT_MIN = 500;
export const COGNITION_LIMIT_MAX = 32_000;

/** One derived insight: compact by definition. */
export const INSIGHT_TEXT_LIMIT = 500;
/** Never learn more than this many insights from a single turn. */
export const INSIGHTS_MAX_PER_TURN = 8;
/** One purge round reads at most this many cognition records. */
export const COGNITION_PURGE_BATCH = 500;

/** Clamp a cognition limit override into the supported envelope. */
export function clampCognitionLimit(value: number): number {
  if (!Number.isFinite(value)) return COGNITION_LIMIT_DEFAULT;
  return Math.min(
    COGNITION_LIMIT_MAX,
    Math.max(COGNITION_LIMIT_MIN, Math.trunc(value)),
  );
}

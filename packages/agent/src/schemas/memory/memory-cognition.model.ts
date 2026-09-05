import { z } from 'zod';

/**
 * The AI's structured cognition — the "profile" half of the memory_cognition
 * space: who the user is (stable identity and durable traits) plus the AI's
 * own persona (the name, role, and voice the user has given it). One living
 * JSON document per cognition key, grown by the memoryProfile queue job with
 * PATCHES merged over it in code (mergeCognitionProfiles): fields a patch
 * omits survive, fields set to null are removed, everything else replaces
 * (arrays wholesale). Stable identity and durable traits only, never task
 * content or one-off moods (research: ~90% of useful cognition entries are
 * durable desires/intentions, not transient state). Every field is NULLISH,
 * so a null patch value is an explicit DELETE — the model omits fields it is
 * not changing and nothing stored survives unless the merge says so;
 * normalizeCognitionProfile strips residual noise (empty strings/arrays)
 * before store.
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
  /**
   * Durable CONVICTIONS the AI synthesized about the user's world — the
   * routing-map topics of its conviction records (depth lives in the
   * conviction points at paths `convictions.<slug>`). Convictions are the
   * AI's own derived conclusions, never statements the user made.
   */
  convictions: nullishTopics,
  /** The AI's own identity as the user has shaped it (name, role, voice). */
  persona: z
    .object({
      /** The name the user gave the AI. */
      name: nullishText,
      /** The role the user assigned the AI (e.g. "coding assistant"). */
      role: nullishText,
      /** Short character description the user gave the AI. */
      personality: nullishText,
      /** How the AI introduces itself, when the user set one. */
      greeting: nullishText,
      /** How the AI should speak. */
      voice: z
        .object({
          tone: nullishText,
          formality: nullishText,
        })
        .nullish(),
    })
    .nullish(),
  /**
   * Learned corrections — behavioral rules the user taught the AI after it
   * got something wrong. Keyed by a short slug (a stable handle for
   * update/remove); the value is the imperative directive ("always …" /
   * "never …"), optionally with a brief why. Deep-merged like preferences.
   */
  corrections: z.record(z.string(), z.string()).nullish(),
});

export type MemoryCognitionProfile = z.infer<typeof memoryCognitionProfileSchema>;

/**
 * True when a patch would null out EVERY stored top-level field with no
 * replacement values — the accidental "forget everything" wipe. Explicit
 * forget turns run through the memory-cognition-forget tool, which empties
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
  const nullKeys = presentKeys.filter((key) => patchRecord[key] === null || patchRecord[key] === undefined);
  // The patch carries only deletions, and they cover every stored field.
  return nullKeys.length === presentKeys.length && currentKeys.every((key) => nullKeys.includes(key));
}

/** Tolerant read of a stored document — anything unparseable starts from scratch. */
export function parseStoredProfile(text: string | undefined): MemoryCognitionProfile {
  if (!text?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as MemoryCognitionProfile) : {};
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

/**
 * The memoryProfile job's structured verdict. `profile: null` means the turn
 * taught nothing new about the user (the existing document stays — the
 * replacement for the old UNCHANGED sentinel); `insights` carries new
 * derived, topic-specific understanding stored as separate probed records.
 * Bare insight strings are tolerated and coerced — small models emit both.
 */
export const memoryProfileResponseSchema = z.preprocess(
  (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;

    const record = value as Record<string, unknown>;
    if (record.insights == null) record.insights = [];
    else if (Array.isArray(record.insights)) {
      record.insights = record.insights.map((item) => (typeof item === 'string' ? { text: item } : item));
    }
    return record;
  },
  z.object({
    profile: memoryCognitionProfileSchema.nullish(),
    insights: z.array(memoryProfileInsightSchema).max(8),
    /**
     * One sentence recording what THIS turn was about — the short-term
     * conversation memory (episode), recalled later by recency-blended probe.
     * Omitted (or null) when the turn had no substance.
     */
    episode: z.string().nullish(),
  }),
);

export type MemoryProfileResponse = z.infer<typeof memoryProfileResponseSchema>;

/** Tag marking a probed insight record of a cognition space. */
export const INSIGHT_TAGS = ['cognition', 'insight'];

/** Tag marking a probed episode record of a cognition space (short-term conversation memory). */
export const EPISODE_TAGS = ['cognition', 'episode'];

/**
 * Tag marking a conviction record of a cognition space — a durable,
 * higher-level conclusion the AI synthesized from the user's curated facts
 * (carries `evidence_ids` back-references). Convictions are the cognition
 * flavor of conviction synthesis: they deepen the user/self model, never pose
 * as user statements.
 */
export const CONVICTION_TAGS = ['cognition', 'conviction'];

/** Memory profile serialized size limits — env baseline MEMORY_COGNITION_LIMIT. */
export const COGNITION_LIMIT_DEFAULT = 5000;
export const COGNITION_LIMIT_MIN = 500;
export const COGNITION_LIMIT_MAX = 32_000;

/** One derived insight: compact by definition. */
export const INSIGHT_TEXT_LIMIT = 500;
/** One conviction: a single self-contained synthesized sentence. */
export const CONVICTION_TEXT_LIMIT = 500;
/** One episode: a single sentence on what a turn was about. */
export const EPISODE_TEXT_LIMIT = 500;
/** Never learn more than this many insights from a single turn. */
export const INSIGHTS_MAX_PER_TURN = 8;
/** One purge round reads at most this many cognition records. */
export const COGNITION_PURGE_BATCH = 500;

/** Clamp a cognition limit override into the supported envelope. */
export function clampCognitionLimit(value: number): number {
  if (!Number.isFinite(value)) return COGNITION_LIMIT_DEFAULT;
  return Math.min(COGNITION_LIMIT_MAX, Math.max(COGNITION_LIMIT_MIN, Math.trunc(value)));
}

/**
 * Episode-probe recency blend defaults — the env baseline for the matching
 * system variables (memory-overrides). The final episode score is
 * `$score + weight * exp_decay(created_at)`; scale is the decay horizon in
 * seconds (an episode `scale` old loses half its recency bonus).
 */
export const EPISODE_RECENCY_WEIGHT_DEFAULT = 0.3;
export const EPISODE_RECENCY_SCALE_SECONDS_DEFAULT = 7 * 24 * 60 * 60;
export const EPISODE_RECENCY_MIDPOINT_DEFAULT = 0.5;
/** Max episode records injected into the respond context per turn. */
export const EPISODE_PROBE_LIMIT_DEFAULT = 3;

/**
 * Minimum cosine score for the episode probe's recency prefetch — the noise
 * floor below which a candidate is dropped BEFORE the recency formula runs.
 * Deliberately far lower than the fact-lane `scoreThreshold`: the episode
 * lane answers meta-questions like "what were we doing recently?" whose
 * topical similarity to any single episode is inherently weak, so the
 * recency blend (not a hard vector gate) is the ranking authority here.
 */
export const EPISODE_SCORE_THRESHOLD_DEFAULT = 0.1;

export const EPISODE_RECENCY_WEIGHT_MIN = 0;
export const EPISODE_RECENCY_WEIGHT_MAX = 1;
export const EPISODE_RECENCY_SCALE_SECONDS_MIN = 60;
export const EPISODE_RECENCY_SCALE_SECONDS_MAX = 31_536_000;
export const EPISODE_RECENCY_MIDPOINT_MIN = 0.01;
export const EPISODE_RECENCY_MIDPOINT_MAX = 0.99;
export const EPISODE_PROBE_LIMIT_MIN = 0;
export const EPISODE_SCORE_THRESHOLD_MIN = 0;
export const EPISODE_SCORE_THRESHOLD_MAX = 1;

/** Clamp the recency weight (0–1) — how much recency may break topical ties. */
export function clampEpisodeRecencyWeight(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_RECENCY_WEIGHT_DEFAULT;
  return Math.min(EPISODE_RECENCY_WEIGHT_MAX, Math.max(EPISODE_RECENCY_WEIGHT_MIN, value));
}

/** Clamp the recency decay horizon in seconds (1 minute – 1 year). */
export function clampEpisodeRecencyScaleSeconds(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_RECENCY_SCALE_SECONDS_DEFAULT;
  return Math.min(EPISODE_RECENCY_SCALE_SECONDS_MAX, Math.max(EPISODE_RECENCY_SCALE_SECONDS_MIN, Math.trunc(value)));
}

/** Clamp the recency decay midpoint (0.01–0.99, exclusive of the endpoints). */
export function clampEpisodeRecencyMidpoint(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_RECENCY_MIDPOINT_DEFAULT;
  return Math.min(EPISODE_RECENCY_MIDPOINT_MAX, Math.max(EPISODE_RECENCY_MIDPOINT_MIN, value));
}

/**
 * Clamp the episode probe limit (0–N records per turn; 0 disables the
 * probe). Unbounded above the floor — the user decides how many episode
 * records may be injected per turn.
 */
export function clampEpisodeProbeLimit(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_PROBE_LIMIT_DEFAULT;
  return Math.max(EPISODE_PROBE_LIMIT_MIN, Math.trunc(value));
}

/** Clamp the episode probe score threshold (0–1) — the recency prefetch noise floor. */
export function clampEpisodeScoreThreshold(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_SCORE_THRESHOLD_DEFAULT;
  return Math.min(EPISODE_SCORE_THRESHOLD_MAX, Math.max(EPISODE_SCORE_THRESHOLD_MIN, value));
}

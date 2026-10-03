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

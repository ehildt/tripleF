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

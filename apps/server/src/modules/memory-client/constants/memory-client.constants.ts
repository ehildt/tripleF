/** Injection token for the resolved memory-app connection config. */
export const MEMORY_CLIENT_CONFIG = Symbol('MEMORY_CLIENT_CONFIG');

/** Job names on the shared vectorize queue (the memory app runs the worker). */
export const VECTORIZE_JOB = 'vectorize';
export const MEMORY_WRITE_JOB = 'memory-write';
export const MEMORY_PROFILE_JOB = 'memory-profile';

/**
 * Distinguishing tag on cognition insight records — the sanitize probe
 * filter. Insights and episodes both carry the shared 'cognition' tag, so an
 * any-match over the full tag array would cross-match the two lanes; the
 * distinguishing tag is the exact filter.
 */
export const INSIGHT_TAG = 'insight';

/** Distinguishing tag on cognition episode records — the short-term conversation-memory probe filter. */
export const EPISODE_TAG = 'episode';

/** Max conviction records injected into the respond context per turn. */
export const CONVICTION_PROBE_LIMIT = 3;

/** Max cluster summaries injected into the respond context per turn (graphRag). */
export const CLUSTER_PROBE_LIMIT = 3;

/** Max episode records injected into the respond context per turn. */
export const EPISODE_PROBE_LIMIT = 3;

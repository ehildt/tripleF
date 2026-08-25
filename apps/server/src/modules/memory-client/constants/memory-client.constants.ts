/** Injection token for the resolved memory-app connection config. */
export const MEMORY_CLIENT_CONFIG = Symbol('MEMORY_CLIENT_CONFIG');

/** Job names on the shared vectorize queue (the memory app runs the worker). */
export const VECTORIZE_JOB = 'vectorize';
export const MEMORY_WRITE_JOB = 'memory-write';
export const MEMORY_PROFILE_JOB = 'memory-profile';

/** Topic tags on cognition insight records — the sanitize probe filter. */
export const INSIGHT_TAGS = ['cognition', 'insight'];

/** Topic tags on cognition episode records — the short-term conversation-memory probe filter. */
export const EPISODE_TAGS = ['cognition', 'episode'];

/** Max episode records injected into the respond context per turn. */
export const EPISODE_PROBE_LIMIT = 3;

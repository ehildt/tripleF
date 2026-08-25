/** Injection token for the resolved Qdrant connection config. */
export const QDRANT_CONFIG = Symbol('QDRANT_CONFIG');

/** Job name on the vectorize queue (one job per turn-side). */
export const VECTORIZE_JOB = 'vectorize';
/** Cognition write jobs on the vectorize queue — the harness memoryWrite/memoryProfile steps only enqueue; the worker runs the LLM calls. */
export const MEMORY_WRITE_JOB = 'memory-write';
export const MEMORY_PROFILE_JOB = 'memory-profile';
/** Consolidation sweep job on the vectorize queue — webhook- or threshold-triggered. */
export const MEMORY_CONSOLIDATE_JOB = 'memory-consolidate';
/** Relink sweep job on the vectorize queue — category-aware consolidation + soft links, endpoint-triggered. */
export const MEMORY_RELINK_JOB = 'memory-relink';
/** Lexicon supersede sweep job on the vectorize queue — deterministic, no model. */
export const LEXICON_CONSOLIDATE_JOB = 'lexicon-consolidate';

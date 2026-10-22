/** Injection token for the resolved Qdrant connection config. */
export const QDRANT_CONFIG = Symbol('QDRANT_CONFIG');

/**
 * Vector names in the named-vector collection schema (hybrid era): `dense`
 * is the embedding model's semantic vector (Cosine); `sparse` is the
 * client-side term-frequency vector over the raw text, with Qdrant applying
 * corpus IDF at search time (the `idf` modifier). Legacy collections store a
 * single unnamed dense vector — the repositories detect that layout and keep
 * the old unnamed query/upsert shape.
 */
export const DENSE_VECTOR = 'dense';

/** The sparse (lexical, TF + server-side IDF) vector's name. */
export const SPARSE_VECTOR = 'sparse';

/** Job name on the vectorize queue (one job per turn-side). */
export const VECTORIZE_JOB = 'vectorize';
/** Cognition-profile jobs on the vectorize queue — the harness memoryProfile step only enqueues; the worker runs the LLM call. */
export const MEMORY_PROFILE_JOB = 'memory-profile';
/** Consolidation sweep job on the vectorize queue — webhook- or threshold-triggered. */
export const MEMORY_CONSOLIDATE_JOB = 'memory-consolidate';
/** Relink sweep job on the vectorize queue — category-aware consolidation + soft links, endpoint-triggered. */
export const MEMORY_RELINK_JOB = 'memory-relink';
/** Encyclopedia supersede sweep job on the vectorize queue — deterministic, no model. */
export const ENCYCLOPEDIA_CONSOLIDATE_JOB = 'encyclopedia-consolidate';
/** Encyclopedia classification job on the vectorize queue — labels documents with category + topic. */
export const ENCYCLOPEDIA_CLASSIFY_JOB = 'encyclopedia-classify';
/** Reflection job on the vectorize queue — per-scope friction screen over unreflected points. */
export const MEMORY_REFLECT_JOB = 'memory-reflect';
/** Conviction-synthesis job on the vectorize queue — synthesizes higher-level convictions/bridges from curated facts. */
export const MEMORY_CONVICTION_JOB = 'memory-conviction';
/** Cluster-detection + summarization job on the vectorize queue — clusters the link graph and summarizes each cluster. */
export const MEMORY_CLUSTER_JOB = 'memory-cluster';
/** Gap-filling research job on the vectorize queue — closes never-fetched encyclopedia gaps, depth-capped. */
export const ENCYCLOPEDIA_RESEARCH_JOB = 'encyclopedia-research';
/** Taxonomy reconciliation job on the vectorize queue — label-merge sweep over one scope's registry, endpoint-triggered. */
export const MEMORY_TAXONOMY_RECONCILE_JOB = 'memory-taxonomy-reconcile';

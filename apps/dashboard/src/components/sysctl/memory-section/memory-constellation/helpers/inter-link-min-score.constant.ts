/**
 * The default minimum cosine score for an inter-cluster (hub → hub) edge.
 *
 * Calibrated against the live partition data embedded with
 * `nomic-embed-text-v2-moe`: unrelated cross-topic pairs (e.g. a game fact
 * vs. a dog-health fact) score 0.51–0.55, while genuine same-topic pairs
 * score 0.68–0.91 — nomic-family embedders have a high anisotropy floor, so
 * anything below ~0.7 is baseline proximity, not relatedness. Aligned with
 * the memory app's `MEMORY_LINK_SCORE_THRESHOLD` default, which applies the
 * same bar when the link graph is written.
 */
export const DEFAULT_INTER_LINK_MIN_SCORE = 0.7;

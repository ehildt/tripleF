/**
 * Cluster-detection + summarization bounds — the memory-cluster job's
 * knobs. A cluster is a cluster of related memory points discovered over
 * the link graph (semantic + topical + evidence edges); every point ends up
 * in exactly one cluster (singletons are absorbed into their nearest
 * cluster, with category grouping as the cold-scope fallback).
 */

/** The two lanes the cluster job covers (cognition is curated, not clustered). */
const MEMORY_CLUSTER_LANES = ['partition', 'encyclopedia'] as const;

/** One cluster lane (the space family a cluster belongs to). */
export type MemoryClusterLane = (typeof MEMORY_CLUSTER_LANES)[number];

/** Minimum members for a structural cluster — env baseline MEMORY_CLUSTER_MIN_MEMBERS. */
export const CLUSTER_MIN_MEMBERS_DEFAULT = 2;
export const CLUSTER_MIN_MEMBERS_MIN = 1;
export const CLUSTER_MIN_MEMBERS_MAX = 100;

/** Max member texts fed to the LLM per cluster summary (bounded cost). */
export const CLUSTER_MEMBER_TEXT_LIMIT = 20;

/** Stored title/summary length caps (mirror the Prisma column widths). */
export const CLUSTER_TITLE_LIMIT = 200;
export const CLUSTER_SUMMARY_LIMIT = 2000;

/** Clamp a cluster min-members override into the supported envelope. */
export function clampClusterMinMembers(value: number): number {
  if (!Number.isFinite(value)) return CLUSTER_MIN_MEMBERS_DEFAULT;
  return Math.min(
    CLUSTER_MIN_MEMBERS_MAX,
    Math.max(CLUSTER_MIN_MEMBERS_MIN, Math.trunc(value)),
  );
}

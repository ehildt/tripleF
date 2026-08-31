import { getMemoryApiUrl } from './api-url';

export interface MemoryOverridesConfig {
  /** Effective cognition profile character cap (override → env baseline). */
  cognitionLimit: number;
  /** The env-backed baseline (MEMORY_COGNITION_LIMIT). */
  baseline: number;
  /** True when a persisted override is active. */
  overridden: boolean;
  /** Effective recency weight for the episode probe (0–1). */
  episodeRecencyWeight: number;
  /** Effective recency decay horizon in seconds. */
  episodeRecencyScaleSeconds: number;
  /** Effective recency decay midpoint (0.01–0.99). */
  episodeRecencyMidpoint: number;
  /** Effective episode probe limit (0–N records per turn; 0 disables the probe). */
  episodeProbeLimit: number;
  /** Effective episode probe score threshold (0–1) — recency prefetch noise floor. */
  episodeScoreThreshold: number;
  /** Effective constellation node-load limit (100–10000 records per space). */
  constellationNodeLimit: number;
  /** Effective partition consolidation model (override → env baseline). */
  consolidateModel?: string;
  /** Effective encyclopedia classification model (override → env baseline). */
  classifyModel?: string;
  /** Effective reflection model (override → env baseline). */
  reflectModel?: string;
  /** Effective conviction-synthesis model (override → env baseline). */
  convictionModel?: string;
  /** Effective cluster-detection model (override → env baseline). */
  clusterModel?: string;
  /** Auto-trigger reflection after a partition consolidation sweep. */
  partitionReflectAutoEnabled: boolean;
  /** Auto-trigger reflection after a cognition profile job. */
  cognitionReflectAutoEnabled: boolean;
  /** Auto-trigger reflection after the encyclopedia classification job. */
  encyclopediaReflectAutoEnabled: boolean;
  /** Auto-trigger conviction synthesis after a partition reflection sweep. */
  convictionAutoEnabled: boolean;
  /** Auto-trigger cluster detection after a lane's graph-mutating job. */
  clusterAutoEnabled: boolean;
  /** Effective reflection batch limit (1–500 points per run). */
  reflectBatchLimit: number;
  /** Effective reflection candidate pool (1–20 neighbors per point). */
  reflectMaxCandidates: number;
  /** Effective conviction-synthesis batch limit (1–500 evidence points per run). */
  convictionBatchLimit: number;
  /** Effective conviction-synthesis output cap (1–1000 convictions per run). */
  convictionMaxPerCluster: number;
  /** Effective minimum members for a structural cluster (1–100). */
  clusterMinMembers: number;
}

/**
 * Memory system variables (sysctl → system): server-side, global settings
 * layered over env defaults — not per-user data. A write takes effect on the
 * very next request without a restart.
 */
export async function fetchMemoryOverrides(): Promise<MemoryOverridesConfig> {
  const res = await fetch(getMemoryApiUrl('/api/v1/memory-overrides'));
  if (!res.ok)
    throw new Error(`Failed to load memory overrides: ${res.status}`);
  return (await res.json()) as MemoryOverridesConfig;
}

export async function updateMemoryOverrides(patch: {
  cognitionLimit?: number | null;
  episodeRecencyWeight?: number | null;
  episodeRecencyScaleSeconds?: number | null;
  episodeRecencyMidpoint?: number | null;
  episodeProbeLimit?: number | null;
  episodeScoreThreshold?: number | null;
  constellationNodeLimit?: number | null;
  consolidateModel?: string | null;
  classifyModel?: string | null;
  reflectModel?: string | null;
  convictionModel?: string | null;
  clusterModel?: string | null;
  partitionReflectAutoEnabled?: boolean | null;
  cognitionReflectAutoEnabled?: boolean | null;
  encyclopediaReflectAutoEnabled?: boolean | null;
  convictionAutoEnabled?: boolean | null;
  clusterAutoEnabled?: boolean | null;
  reflectBatchLimit?: number | null;
  reflectMaxCandidates?: number | null;
  convictionBatchLimit?: number | null;
  convictionMaxPerCluster?: number | null;
  clusterMinMembers?: number | null;
}): Promise<MemoryOverridesConfig> {
  const res = await fetch(getMemoryApiUrl('/api/v1/memory-overrides'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok)
    throw new Error(`Failed to save memory overrides: ${res.status}`);
  return (await res.json()) as MemoryOverridesConfig;
}

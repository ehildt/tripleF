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

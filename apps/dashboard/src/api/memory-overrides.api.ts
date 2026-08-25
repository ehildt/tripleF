import { getApiUrl } from './api-url';

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
  /** Effective episode probe limit (1–10 records per turn). */
  episodeProbeLimit: number;
}

/**
 * Memory system variables (sysctl → system): server-side, global settings
 * layered over env defaults — not per-user data. A write takes effect on the
 * very next request without a restart.
 */
export async function fetchMemoryOverrides(): Promise<MemoryOverridesConfig> {
  const res = await fetch(getApiUrl('/api/v1/memory-overrides'));
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
}): Promise<MemoryOverridesConfig> {
  const res = await fetch(getApiUrl('/api/v1/memory-overrides'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok)
    throw new Error(`Failed to save memory overrides: ${res.status}`);
  return (await res.json()) as MemoryOverridesConfig;
}

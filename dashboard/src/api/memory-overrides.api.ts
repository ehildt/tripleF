import { getApiUrl } from './api-url';

export interface MemoryOverridesConfig {
  /** Effective cognition profile character cap (override → env baseline). */
  cognitionLimit: number;
  /** The env-backed baseline (MEMORY_COGNITION_LIMIT). */
  baseline: number;
  /** True when a persisted override is active. */
  overridden: boolean;
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

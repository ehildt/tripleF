import { EPISODE_PROBE_LIMIT_DEFAULT, EPISODE_PROBE_LIMIT_MIN } from './memory-cognition.constant.js';

/**
 * Clamp the episode probe limit (0–N records per turn; 0 disables the
 * probe). Unbounded above the floor — the user decides how many episode
 * records may be injected per turn.
 */
export function clampEpisodeProbeLimit(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_PROBE_LIMIT_DEFAULT;
  return Math.max(EPISODE_PROBE_LIMIT_MIN, Math.trunc(value));
}

import {
  EPISODE_RECENCY_MIDPOINT_DEFAULT,
  EPISODE_RECENCY_MIDPOINT_MAX,
  EPISODE_RECENCY_MIDPOINT_MIN,
} from './memory-cognition.constant.js';

/** Clamp the recency decay midpoint (0.01–0.99, exclusive of the endpoints). */
export function clampEpisodeRecencyMidpoint(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_RECENCY_MIDPOINT_DEFAULT;
  return Math.min(EPISODE_RECENCY_MIDPOINT_MAX, Math.max(EPISODE_RECENCY_MIDPOINT_MIN, value));
}

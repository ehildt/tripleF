import {
  EPISODE_RECENCY_WEIGHT_DEFAULT,
  EPISODE_RECENCY_WEIGHT_MAX,
  EPISODE_RECENCY_WEIGHT_MIN,
} from './memory-cognition.constant.js';

/** Clamp the recency weight (0–1) — how much recency may break topical ties. */
export function clampEpisodeRecencyWeight(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_RECENCY_WEIGHT_DEFAULT;
  return Math.min(EPISODE_RECENCY_WEIGHT_MAX, Math.max(EPISODE_RECENCY_WEIGHT_MIN, value));
}

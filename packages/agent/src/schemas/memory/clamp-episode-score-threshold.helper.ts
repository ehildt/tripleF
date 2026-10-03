import {
  EPISODE_SCORE_THRESHOLD_DEFAULT,
  EPISODE_SCORE_THRESHOLD_MAX,
  EPISODE_SCORE_THRESHOLD_MIN,
} from './memory-cognition.constant.js';

/** Clamp the episode probe score threshold (0–1) — the recency prefetch noise floor. */
export function clampEpisodeScoreThreshold(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_SCORE_THRESHOLD_DEFAULT;
  return Math.min(EPISODE_SCORE_THRESHOLD_MAX, Math.max(EPISODE_SCORE_THRESHOLD_MIN, value));
}

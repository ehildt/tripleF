import {
  EPISODE_RECENCY_SCALE_SECONDS_DEFAULT,
  EPISODE_RECENCY_SCALE_SECONDS_MAX,
  EPISODE_RECENCY_SCALE_SECONDS_MIN,
} from './memory-cognition.constant.js';

/** Clamp the recency decay horizon in seconds (1 minute – 1 year). */
export function clampEpisodeRecencyScaleSeconds(value: number): number {
  if (!Number.isFinite(value)) return EPISODE_RECENCY_SCALE_SECONDS_DEFAULT;
  return Math.min(EPISODE_RECENCY_SCALE_SECONDS_MAX, Math.max(EPISODE_RECENCY_SCALE_SECONDS_MIN, Math.trunc(value)));
}

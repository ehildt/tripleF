import { COGNITION_LIMIT_DEFAULT, COGNITION_LIMIT_MAX, COGNITION_LIMIT_MIN } from './memory-cognition.constant.js';

/** Clamp a cognition limit override into the supported envelope. */
export function clampCognitionLimit(value: number): number {
  if (!Number.isFinite(value)) return COGNITION_LIMIT_DEFAULT;
  return Math.min(COGNITION_LIMIT_MAX, Math.max(COGNITION_LIMIT_MIN, Math.trunc(value)));
}

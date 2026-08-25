import type {
  ConstellationPosition,
  DotTransition,
} from '../MemoryConstellation.types';
import { easeInCubic } from './ease-in-cubic.helper';
import { easeOutCubic } from './ease-out-cubic.helper';

/**
 * Interpolated world position for a dot mid-transition (else its final
 * position). Expand bursts straight out of the start position; collapse is
 * the exact reverse — a straight line back into the end position.
 */
export function interpolateTransitionPosition(
  transition: DotTransition | undefined,
  finalPos: ConstellationPosition,
  nowMs: number,
): ConstellationPosition {
  if (!transition) return finalPos;
  const progress = Math.min(
    1,
    (nowMs - transition.startTime) / transition.duration,
  );
  const e =
    transition.kind === 'expand'
      ? easeOutCubic(progress)
      : easeInCubic(progress);
  return {
    x: transition.start.x + (transition.end.x - transition.start.x) * e,
    y: transition.start.y + (transition.end.y - transition.start.y) * e,
    z: transition.start.z + (transition.end.z - transition.start.z) * e,
  };
}

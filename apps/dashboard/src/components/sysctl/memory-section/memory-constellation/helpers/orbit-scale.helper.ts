import type { DotTransition } from '../MemoryConstellation.types';
import { easeInCubic } from './ease-in-cubic.helper';
import { easeOutCubic } from './ease-out-cubic.helper';

/**
 * Orbit offset scale for a leaf mid-transition. Full orbit (1) when idle or
 * bursting out; shrinks to 0 as a collapse completes so leaves settle
 * exactly on the category dot instead of lingering on their orbit radius.
 * Expand mirrors it: the orbit grows from 0 to 1 as the leaf bursts out.
 */
export function orbitScaleFor(
  transition: DotTransition | undefined,
  nowMs: number,
): number {
  if (!transition) return 1;
  const progress = Math.min(
    1,
    (nowMs - transition.startTime) / transition.duration,
  );
  return transition.kind === 'collapse'
    ? 1 - easeInCubic(progress)
    : easeOutCubic(progress);
}

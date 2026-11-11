import {
  LARGE_SCENE_NODE_COUNT,
  RELAX_TICKS,
  RELAX_TICKS_LARGE,
} from './relax-constellation.constant';

/** Calculate the tick budget; large scenes settle with fewer passes. */
export function calcRelaxTicks(nodeCount: number): number {
  return nodeCount > LARGE_SCENE_NODE_COUNT ? RELAX_TICKS_LARGE : RELAX_TICKS;
}

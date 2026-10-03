import type { HlcPoint } from './build-hlc-area-paths.helper.types';

/** The SVG line path through the points at the given y coordinate. */
export function linePath(
  points: HlcPoint[],
  yAccessor: (point: HlcPoint) => number,
): string {
  return points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${yAccessor(point)}`)
    .join(' ');
}

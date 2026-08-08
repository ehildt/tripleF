/** A bar's geometry in pixel space. */
export interface HlcPoint {
  x: number;
  high: number;
  low: number;
  close: number;
}

/** SVG path data for the HLC area style. */
export interface HlcAreaPaths {
  topArea: string;
  bottomArea: string;
  highLine: string;
  lowLine: string;
  closeLine: string;
}

const EMPTY: HlcAreaPaths = {
  topArea: '',
  bottomArea: '',
  highLine: '',
  lowLine: '',
  closeLine: '',
};

function linePath(
  points: HlcPoint[],
  yAccessor: (point: HlcPoint) => number,
): string {
  return points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${yAccessor(point)}`)
    .join(' ');
}

/**
 * Build the path data for the HLC area style: a high line, a low line, a
 * close line, and the two filled areas between the close and the high/low.
 * The close line is emitted in reverse so the area paths can reuse it
 * directly (the same trick the lightweight-charts plugin renderer used).
 */
export function buildHlcAreaPaths(points: HlcPoint[]): HlcAreaPaths {
  if (points.length === 0) return EMPTY;
  const first = points[0];
  const last = points[points.length - 1];
  const highLine = linePath(points, (p) => p.high);
  const lowLine = linePath(points, (p) => p.low);
  const closeLine = [...points]
    .reverse()
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.close}`)
    .join(' ');
  return {
    topArea: `${highLine} L ${last.x} ${last.close} ${closeLine} L ${first.x} ${first.high} Z`,
    bottomArea: `${lowLine} L ${last.x} ${last.close} ${closeLine} L ${first.x} ${first.low} Z`,
    highLine,
    lowLine,
    closeLine,
  };
}

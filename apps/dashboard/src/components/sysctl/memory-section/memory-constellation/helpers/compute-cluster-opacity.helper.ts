/** One projected node position, tagged with its cluster key. */
export interface ClusterPoint {
  clusterKey: string;
  x: number;
  y: number;
}

/** Zoom where the focus fade begins (below = every cluster full opacity). */
const ZOOM_FOCUS_THRESHOLD = 1.5;
/** Zoom where the fade is complete (non-focus clusters at FADED_OPACITY). */
const ZOOM_FOCUS_MAX = 3;
/** Opacity of non-focus clusters when fully zoomed in. */
const FADED_OPACITY = 0.25;

/**
 * Per-cluster opacity for the zoom-focus effect: once the camera zooms past
 * `ZOOM_FOCUS_THRESHOLD`, the cluster whose centroid is nearest the focus
 * anchor (the cursor, or the view center when the pointer is off-canvas)
 * stays at full opacity and every other cluster fades toward `FADED_OPACITY`
 * (smoothly interpolated up to `ZOOM_FOCUS_MAX`). Below the threshold every
 * cluster is fully opaque.
 */
export function computeClusterOpacity(
  points: readonly ClusterPoint[],
  fx: number,
  fy: number,
  zoom: number,
): Map<string, number> {
  const opacity = new Map<string, number>();
  if (points.length === 0) return opacity;

  const clusters = new Map<string, { sx: number; sy: number; count: number }>();
  for (const point of points) {
    const cluster = clusters.get(point.clusterKey) ?? {
      sx: 0,
      sy: 0,
      count: 0,
    };
    cluster.sx += point.x;
    cluster.sy += point.y;
    cluster.count++;
    clusters.set(point.clusterKey, cluster);
  }

  let focusKey = '';
  let bestDist = Infinity;
  for (const [key, cluster] of clusters) {
    const x = cluster.sx / cluster.count;
    const y = cluster.sy / cluster.count;
    const dist = (x - fx) ** 2 + (y - fy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      focusKey = key;
    }
  }

  const fade = computeFade(zoom);

  for (const key of clusters.keys()) {
    opacity.set(key, key === focusKey ? 1 : 1 - fade * (1 - FADED_OPACITY));
  }
  return opacity;
}

/** 0 at the threshold, 1 at the max zoom, linear in between. */
function computeFade(zoom: number): number {
  if (zoom <= ZOOM_FOCUS_THRESHOLD) return 0;
  if (zoom >= ZOOM_FOCUS_MAX) return 1;
  return (
    (zoom - ZOOM_FOCUS_THRESHOLD) / (ZOOM_FOCUS_MAX - ZOOM_FOCUS_THRESHOLD)
  );
}

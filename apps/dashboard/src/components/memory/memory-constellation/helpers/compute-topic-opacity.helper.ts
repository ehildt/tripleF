/** One projected node position, tagged with its topic key. */
export interface TopicPoint {
  topicKey: string;
  x: number;
  y: number;
}

/** Zoom where the focus fade begins (below = every topic full opacity). */
const ZOOM_FOCUS_THRESHOLD = 1.5;
/** Zoom where the fade is complete (non-focus topics at FADED_OPACITY). */
const ZOOM_FOCUS_MAX = 3;
/** Opacity of non-focus topics when fully zoomed in. */
const FADED_OPACITY = 0.25;

/**
 * Per-topic opacity for the zoom-focus effect: once the camera zooms past
 * `ZOOM_FOCUS_THRESHOLD`, the topic whose centroid is nearest the focus
 * anchor (the cursor, or the view center when the pointer is off-canvas)
 * stays at full opacity and every other topic fades toward `FADED_OPACITY`
 * (smoothly interpolated up to `ZOOM_FOCUS_MAX`). Below the threshold every
 * topic is fully opaque.
 */
export function computeTopicOpacity(
  points: readonly TopicPoint[],
  fx: number,
  fy: number,
  zoom: number,
): Map<string, number> {
  const opacity = new Map<string, number>();
  if (points.length === 0) return opacity;

  const topics = new Map<string, { sx: number; sy: number; count: number }>();
  for (const point of points) {
    const topic = topics.get(point.topicKey) ?? {
      sx: 0,
      sy: 0,
      count: 0,
    };
    topic.sx += point.x;
    topic.sy += point.y;
    topic.count++;
    topics.set(point.topicKey, topic);
  }

  let focusKey = '';
  let bestDist = Infinity;
  for (const [key, topic] of topics) {
    const x = topic.sx / topic.count;
    const y = topic.sy / topic.count;
    const dist = (x - fx) ** 2 + (y - fy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      focusKey = key;
    }
  }

  const fade = computeFade(zoom);

  for (const key of topics.keys()) {
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

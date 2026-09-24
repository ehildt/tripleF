import type { ChartMarker } from '@/types/harness-response-data.model';

/**
 * Collapse duplicate chart markers. The model can emit the same annotation
 * more than once (e.g. a repeated buy/sell signal at the same bar); keep only
 * the first of any markers sharing time, position, and text.
 */
export function dedupeMarkers(markers: ChartMarker[]): ChartMarker[] {
  const seen = new Set<string>();
  const result: ChartMarker[] = [];
  for (const marker of markers) {
    const key = `${marker.time}|${marker.position}|${marker.text ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(marker);
  }
  return result;
}

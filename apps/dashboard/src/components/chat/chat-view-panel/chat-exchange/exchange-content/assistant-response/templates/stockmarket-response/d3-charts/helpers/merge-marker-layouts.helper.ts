import type { MarkerLayout } from './build-marker-layout.helper';

/**
 * Merge the model's explicit annotations with the fallback pivot buy/sell
 * markers: the pivots are the baseline signal layer, the explicit markers add
 * annotations (dividends, all-time highs, …) on top. When a pivot anchors to
 * the same bar on the same side as an explicit marker, the explicit one wins,
 * so a bar never shows two arrow columns with competing labels.
 */
export function mergeMarkerLayouts(
  explicit: MarkerLayout[],
  pivots: MarkerLayout[],
): MarkerLayout[] {
  const taken = new Set(
    explicit.map((layout) => `${layout.index}|${layout.textAbove}`),
  );
  return [
    ...explicit,
    ...pivots.filter(
      (layout) => !taken.has(`${layout.index}|${layout.textAbove}`),
    ),
  ];
}

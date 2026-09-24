import type { MarkerLayout } from './build-marker-layout.helper';

/** Vertical gap (px) between markers stacked on the same bar. */
const STACK_GAP = 10;

/** A marker layout with its vertical stack offset applied. */
export interface StackedMarkerLayout extends MarkerLayout {
  /** Vertical offset (px) applied to the whole marker group. */
  stackOffset: number;
}

/**
 * Markers that share a bar are stacked vertically so they never overlap:
 * the first marker stays at its price, the rest are pushed 10px above
 * (above-bar markers) or below (below-bar markers) per slot.
 */
export function stackMarkerLayouts(
  layouts: MarkerLayout[],
): StackedMarkerLayout[] {
  const byIndex = new Map<number, MarkerLayout[]>();
  for (const layout of layouts) {
    const group = byIndex.get(layout.index);
    if (group) group.push(layout);
    else byIndex.set(layout.index, [layout]);
  }
  const result: StackedMarkerLayout[] = [];
  for (const group of byIndex.values()) {
    const above = group.filter((layout) => layout.textAbove);
    const below = group.filter((layout) => !layout.textAbove);
    above.forEach((layout, slot) => {
      result.push({ ...layout, stackOffset: -slot * STACK_GAP });
    });
    below.forEach((layout, slot) => {
      result.push({ ...layout, stackOffset: slot * STACK_GAP });
    });
  }
  return result;
}

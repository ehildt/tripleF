/**
 * Clamp a vertical pan (the zoom transform's pixel offset) to a price shift:
 * never further than one pane (90% of the visible price span, so 10% of the
 * data always stays in view and a hard drag can never push the series off
 * the plot), and never below the zero floor at low prices. Positive input
 * pans down (domain moves lower), negative pans up.
 */
export function clampPricePanShift(
  panOffsetPx: number,
  priceBandHeight: number,
  priceSpan: number,
  priceFloor: number,
): number {
  const maxShift = priceSpan * 0.9;
  const rawShift = (panOffsetPx / priceBandHeight) * priceSpan;
  return Math.min(
    maxShift,
    Math.max(Math.max(0 - priceFloor, -maxShift), rawShift),
  );
}

/** A fractional bar-index window, `to` exclusive. */
export interface IndexWindow {
  from: number;
  to: number;
}

/**
 * The intended visible window from the range state: `null` fits everything,
 * a bar count shows the trailing slice of the series. This is the D3 mirror
 * of the lightweight-charts logical-range windowing.
 */
export function computeVisibleWindow(
  dataLength: number,
  activeBars: number | null,
): IndexWindow {
  if (dataLength <= 0) return { from: 0, to: 0 };
  if (activeBars === null) return { from: 0, to: dataLength };
  const from = Math.max(0, dataLength - activeBars);
  return { from, to: dataLength };
}

/** The plot area inside the canvas, in pixels. */
export interface D3ChartPlot {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Padding around the plot area inside the canvas. */
const PLOT_PADDING = 6;
/** Width of the right gutter reserved for price labels + badges. */
const AXIS_GUTTER_RIGHT = 56;
/** Height of the bottom gutter reserved for time labels. */
const AXIS_GUTTER_BOTTOM = 24;

/**
 * The plot area inside the canvas, leaving room for the price and time
 * gutters. The right gutter grows to fit the widest reference-line badge
 * when one is supplied.
 */
export function computePlot(
  width: number,
  height: number,
  gutterWidth: number = AXIS_GUTTER_RIGHT,
): D3ChartPlot {
  const gutter = Math.max(AXIS_GUTTER_RIGHT, gutterWidth);
  return {
    left: PLOT_PADDING,
    top: PLOT_PADDING,
    right: Math.max(PLOT_PADDING, width - gutter),
    bottom: Math.max(PLOT_PADDING, height - AXIS_GUTTER_BOTTOM),
  };
}

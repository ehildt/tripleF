/** Props for `ChartControls`, the range selector and zoom controls. */
export interface ChartControlsProps {
  /** Whether to show the range selector (1M / 3M / … / All). */
  showRange?: boolean;
  /** Initial active range (bars); e.g. 22 for a 1M default. */
  defaultBars?: number;
  /** Whether the 1D (intraday) view is currently active. */
  intradayActive?: boolean;
  /**
   * Whether intraday bars were streamed. When false the 1D button renders
   * disabled instead of silently doing nothing on click.
   */
  intradayAvailable?: boolean;
  /**
   * The range the visible window currently maps to ("1W"…"5Y", "All"), so
   * the buttons follow zoom/pan instead of only the last click.
   */
  activeRangeLabel?: string;
  /**
   * The capped range the user selected (bars, or null for All). Stays
   * highlighted while zooming in; the zoomed range shows in a second color.
   */
  selectedRangeBars?: number | null;
  /**
   * The loaded history's span in calendar days; range buttons beyond the
   * available data are hidden.
   */
  availableDays?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  /** Number of bars to show for a range selection. */
  onRange?: (bars: number) => void;
  /** Switch to/from the 1D intraday view. */
  onIntraday?: () => void;
}

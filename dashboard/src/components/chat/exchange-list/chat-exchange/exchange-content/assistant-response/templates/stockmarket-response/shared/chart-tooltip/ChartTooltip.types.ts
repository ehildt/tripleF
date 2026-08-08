/** A single label/value pair rendered in the crosshair tooltip. */
export interface ChartTooltipRow {
  label: string;
  value: string;
  /** Optional theme color for the value text (e.g. a `--color-*` token name). */
  color?: string;
}

/** Reactive state of the crosshair-linked tooltip, driven by a chart leaf. */
export interface ChartTooltipState {
  visible: boolean;
  /** Cursor position relative to the chart container (px). */
  x: number;
  y: number;
  rows: ChartTooltipRow[];
}

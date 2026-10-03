/** One price-band cell of a heatmap day. */
export interface HeatmapCell {
  low: number;
  high: number;
  amount: number;
}

/** One day's non-empty band cells on the global price grid. */
export interface HeatmapDayCells {
  time: string;
  cells: HeatmapCell[];
}

/** The history slice the heatmap grid is built from. */
export interface HeatmapHistoryPoint {
  time: string;
  high: number;
  low: number;
  volume: number;
}

/** Per-day, per-price-band volume from the EODHD intraday tool. */
export interface HeatmapProfilePoint {
  time: string;
  bands: Array<{ low: number; high: number; volume: number }>;
}

/** The global price-band grid spanning the full history window. */
export interface BandGrid {
  minPrice: number;
  step: number;
  bandCount: number;
}

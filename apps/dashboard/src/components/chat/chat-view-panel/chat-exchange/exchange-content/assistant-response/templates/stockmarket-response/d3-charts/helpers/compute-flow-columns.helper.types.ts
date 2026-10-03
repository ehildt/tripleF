/** One day of flow-ribbon geometry (price space). */
export interface FlowColumn {
  /** Volume-weighted center price of the day. */
  centroid: number;
  /** Half the ribbon height in price units (volume-weighted spread). */
  halfWidth: number;
  /** 0..1: the day's volume share of the busiest day. */
  intensity: number;
}

/** Raw per-day aggregates from a day's band cells. */
export interface DayStats {
  total: number;
  centroid: number;
  spread: number;
}

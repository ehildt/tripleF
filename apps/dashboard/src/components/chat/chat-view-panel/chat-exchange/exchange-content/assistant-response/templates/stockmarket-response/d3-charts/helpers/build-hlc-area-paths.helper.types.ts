/** A bar's geometry in pixel space. */
export interface HlcPoint {
  x: number;
  high: number;
  low: number;
  close: number;
}

/** SVG path data for the HLC area style. */
export interface HlcAreaPaths {
  topArea: string;
  bottomArea: string;
  highLine: string;
  lowLine: string;
  closeLine: string;
}

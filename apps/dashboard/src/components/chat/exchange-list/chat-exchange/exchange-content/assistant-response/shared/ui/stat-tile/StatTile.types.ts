export type StatTileRoot = 'li' | 'div';

export interface StatTileProps {
  /**
   * Root element: `li` inside a key-findings list, or `div` (rendering
   * dt/dd children) inside a fundamentals definition list. Defaults to `li`.
   */
  as?: StatTileRoot;
  /** Muted uppercase label above the value; omit for value-only tiles. */
  label?: string;
  /** The prominent value. */
  value: string;
  /**
   * Accent color as a CSS `var()` reference — e.g. `pickCycleColor(index)`.
   * Sets `--stat-tile-color`; falls back to the accent token.
   */
  tint?: string;
}

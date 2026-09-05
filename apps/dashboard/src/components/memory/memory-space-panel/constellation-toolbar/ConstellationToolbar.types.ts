export interface ConstellationToolbarProps {
  /** Refresh action tooltip (the per-space reload label). */
  refreshTitle: string;
  /** Read round-trip in flight — blocks the refresh action. */
  isRefreshDisabled?: boolean;
  /** Hub/category label visibility (drives the labels toggle state). */
  showLabels: boolean;
  /** Idle auto-rotation on/off (drives the rotation toggle state). */
  rotationEnabled: boolean;
  /** All topics expanded (drives the collapse/expand-all toggle state). */
  isAllExpanded: boolean;
  /** Strict view on (only curated + linked + reflected points). */
  strictMode: boolean;
  /** Weak (suggested/topical) edges on — the electricity arcs. */
  showSuggested: boolean;
  /** Wipe action tooltip — omit for read-only spaces (no wipe button). */
  wipeTitle?: string;
  /** Wipe confirm armed (two-click wipe). */
  wipeArmed?: boolean;
  /** Blocks the wipe action (loading or empty). */
  isWipeDisabled?: boolean;
}

export interface ConstellationToolbarEmits {
  (e: 'refresh'): void;
  (e: 'toggleLabels'): void;
  (e: 'toggleRotation'): void;
  (e: 'toggleAllTopics'): void;
  (e: 'toggleStrictMode'): void;
  (e: 'toggleSuggested'): void;
  (e: 'resetView'): void;
  (e: 'wipe'): void;
}

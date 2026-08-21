export interface PartitionPanelProps {
  /** The composed display text: one dated line per stored fact record. */
  displayText: string;
  /** Memory off or unreachable — the panel shows the unavailable note. */
  isUnavailable: boolean;
  /** Nothing stored yet — the panel shows the empty note. */
  isEmpty: boolean;
  /** Armed two-click wipe state (pulsing danger until the second click). */
  wipeArmed: boolean;
  /** Buttons blocked while read/write round-trips run. */
  disabled: boolean;
}

export interface PartitionPanelEmits {
  (e: 'refresh'): void;
  (e: 'wipe'): void;
}

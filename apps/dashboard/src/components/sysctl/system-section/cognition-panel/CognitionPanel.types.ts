export interface CognitionPanelProps {
  /** The composed display text: pretty-printed profile document, then the probed-insights section. */
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

export interface CognitionPanelEmits {
  (e: 'refresh'): void;
  (e: 'wipe'): void;
}

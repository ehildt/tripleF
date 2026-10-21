import type { LucideIcon } from '@lucide/vue';

/** One icon-only option of a segmented toggle. */
export interface SegmentedFieldCardOption {
  /** The value this option selects when clicked. */
  value: string;
  /** Option icon (the toggle is icon-only). */
  icon: LucideIcon;
  /** Tooltip and aria label of the option button. */
  tooltip: string;
}

/** One segmented toggle rendered inline in the card. */
export interface SegmentedFieldCardToggle {
  /** Stable key identifying this toggle within the card. */
  key: string;
  /** Accessible group label of the toggle row. */
  ariaLabel: string;
  /** The joinable options; exactly one is active per toggle. */
  options: readonly SegmentedFieldCardOption[];
  /** The currently active option value. */
  value: string;
  /** Called with the picked option value. */
  onSelect: (value: string) => void;
}

export interface SegmentedFieldCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
  /**
   * The segmented toggles rendered inline, right of the label. Most cards
   * carry one; position pickers carry a vertical + horizontal pair.
   */
  toggles: readonly SegmentedFieldCardToggle[];
  /** Dims the whole card and blocks every interaction. */
  disabled?: boolean;
}

import type { LucideIcon } from '@lucide/vue';

export interface SelectFieldCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
  /** The selectable values. */
  options: readonly string[];
  /** Placeholder shown while no option is selected. */
  placeholder?: string;
  /** Dims the whole card and blocks every interaction. */
  disabled?: boolean;
  /** Whether the picked option is marked with a check icon (default true). */
  checkmark?: boolean;
  /** Optional transform applied to the displayed value and each option label. */
  formatValue?: (value: string) => string;
  /**
   * Shows a loading skeleton in place of the select (e.g. while the option
   * list is still being fetched).
   */
  loading?: boolean;
  /**
   * Tooltip text over the loading skeleton, explaining what is loading.
   * Without it the skeleton renders untooltipped.
   */
  loadingLabel?: string;
}

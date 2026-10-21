import type { LucideIcon } from '@lucide/vue';

export interface TextFieldCardProps {
  /** Icon rendered in the tile at the start of the card. */
  icon: LucideIcon;
  /** Short mono label identifying the setting. */
  label: string;
  /** One-line explanation rendered under the label, truncated with a tooltip. */
  description?: string;
  /** Name attribute of the inner input; aids browser autofill grouping. */
  name?: string;
  /** Placeholder shown while the input is empty. */
  placeholder?: string;
  /** Disables the inner input (read-only contexts). */
  disabled?: boolean;
  /**
   * Commit hook: called with the native change event (blur/Enter) — the
   * settings fields patch their value on commit, not per keystroke.
   */
  onCommit?: (event: Event) => void;
  /**
   * Focus hook: called with the native focus event — secret fields select
   * their masked text so typing replaces it.
   */
  onFocus?: (event: FocusEvent) => void;
}

export interface DropDownItemProps {
  /** Option value emitted on select. */
  option: string;
  /** Pre-formatted display text. */
  label: string;
  /** Whether this option is the current selection. */
  selected: boolean;
  /** Render the check column (only the default menu look has one). */
  showCheck: boolean;
}

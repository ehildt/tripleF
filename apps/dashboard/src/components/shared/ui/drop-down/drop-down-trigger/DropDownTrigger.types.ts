export interface DropDownTriggerProps {
  /** Visual style: `labeled` renders the input-style field, `icon-only` the compact toolbar button. */
  variant: 'labeled' | 'icon-only';
  /** Label text (labeled) and the tooltip/aria basis (icon-only). */
  label: string;
  /** Displayed selected value text (labeled variant only). */
  valueText: string;
  /** Disables the trigger and dims it. */
  disabled: boolean;
  /** Error indicator on the field (labeled variant, requires #error-icon slot content). */
  errored: boolean;
  /** Whether the menu is open (active styling on the icon-only button). */
  open: boolean;
  /** Compact sizing for the icon-only button. */
  size: 'sm' | 'md';
}

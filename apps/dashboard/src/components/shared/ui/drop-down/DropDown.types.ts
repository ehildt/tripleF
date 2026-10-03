export interface DropDownProps {
  /** Visual style: `labeled` for input-style trigger, `icon-only` for compact toolbar button. */
  variant?: 'labeled' | 'icon-only';
  /** Menu item appearance: `default` shows a check on the selected item, `centered` renders the options as model-list style card rows with no check column (the chat menu's context select and the prompt-bar think/context dropdowns). */
  menuStyle?: 'default' | 'centered';
  /** Horizontal alignment of the dropdown menu relative to the trigger. */
  align?: 'left' | 'center' | 'right';
  /** Vertical side the menu opens toward. */
  side?: 'top' | 'bottom';
  /** Label text displayed in the trigger button (labeled variant only). */
  label: string;
  /** Available options to select from. Ignored when the #menu slot renders custom content. */
  options?: readonly string[];
  /** Currently selected value. */
  modelValue: string;
  /** Disables interaction and dims the trigger. */
  disabled?: boolean;
  /** Placeholder text shown when no value is selected (falls back to `label`). */
  placeholder?: string;
  /** Optional transform applied to the displayed value and each option label. */
  formatValue?: (value: string) => string;
  /** Shows an error indicator on the trigger. Requires `#error-icon` slot content. */
  errored?: boolean;
  /** Compact sizing for the icon-only trigger: `sm` shrinks the trigger
   *  padding to the 1rem hit box of the sm icon-button triggers in the
   *  floating prompt-bar strips (the slotted icon's size stays the
   *  consumer's). No effect on the labeled variant. */
  size?: 'sm' | 'md';
  /** Teleports the menu to <body> and anchors it below the trigger (escapes scroll/clip contexts). */
  teleport?: boolean;
}

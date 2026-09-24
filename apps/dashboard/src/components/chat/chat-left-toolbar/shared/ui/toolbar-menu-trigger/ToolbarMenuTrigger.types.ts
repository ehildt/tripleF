export interface ToolbarMenuTriggerProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Whether the trigger is disabled (no model selected). */
  isDisabled: boolean;
  /** Tooltip text for the trigger button. */
  title: string;
  /** Blink state for the trigger icon (brain-blink cue). */
  blinking?: boolean;
  /** CSS width for the dropdown panel. */
  dropdownWidth?: string;
}

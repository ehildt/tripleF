export interface ConversationMenuTriggerProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Whether the trigger is disabled (no model selected). */
  isDisabled: boolean;
  /** Blink state for the trigger icon (brain-blink cue). */
  blinking?: { value: boolean };
  /** Invoked on trigger hover while disabled (brain blink). */
  onMouseEnter?: () => void;
  /** Invoked on trigger leave while disabled (brain blink). */
  onMouseLeave?: () => void;
}

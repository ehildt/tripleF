export interface ConversationMenuProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Blink state for the trigger icon (brain-blink cue). */
  blinking?: { value: boolean };
  /** Invoked on trigger hover while disabled (brain blink). */
  onMouseEnter?: () => void;
  /** Invoked on trigger leave while disabled (brain blink). */
  onMouseLeave?: () => void;
}

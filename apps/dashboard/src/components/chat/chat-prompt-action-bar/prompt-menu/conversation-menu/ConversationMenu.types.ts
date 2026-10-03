export interface ConversationMenuProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Whether the trigger is disabled (no model selected). */
  isDisabled: boolean;
  /** Blink state for the trigger icon (brain-blink cue when disabled). */
  blinking?: boolean;
  /** Draft conversation name. */
  name: string;
  /** Draft socket event. */
  event: string;
  /** Draft channel (room id). */
  roomId: string;
  /** Selected context size (numCtx) option value. */
  numCtxValue: string;
  /** Available context size options. */
  contextOptions: string[];
  /** Formats a context size option for display. */
  formatContextValue: (value: string) => string;
  /** Active socket events available for the event combo box. */
  availableEvents: string[];
  /** Known channels for the currently entered socket event. */
  availableRooms: string[];
}

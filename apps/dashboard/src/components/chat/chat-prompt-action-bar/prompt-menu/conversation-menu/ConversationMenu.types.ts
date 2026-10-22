export interface ConversationMenuProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Whether the trigger is disabled (no model selected). */
  isDisabled: boolean;
  /** Whether no conversation is active yet — the trigger blinks until one is
   *  started (inert while the trigger is disabled). */
  hasNoActiveConversation: boolean;
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
  /** Active socket events available for the event combo box. */
  availableEvents: string[];
  /** Known channels for the currently entered socket event. */
  availableRooms: string[];
}

export interface ChatToolbarProps {
  /** Whether the chat session is active (closes menus when it deactivates). */
  chatActive: boolean;
  /** Whether the prompt input currently has focus. */
  promptFocused: boolean;
}

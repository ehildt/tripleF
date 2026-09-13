export interface ConversationContextSelectProps {
  /** Currently selected context size. */
  modelValue: string;
  /** Available context-size options. */
  options: readonly string[];
  /** Formats an option value for display. */
  formatValue: (value: string) => string;
}

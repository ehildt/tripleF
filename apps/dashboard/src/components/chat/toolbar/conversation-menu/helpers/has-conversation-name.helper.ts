/** True when a conversation name is present after trimming whitespace. */
export function hasConversationName(name: string): boolean {
  return name.trim().length > 0;
}

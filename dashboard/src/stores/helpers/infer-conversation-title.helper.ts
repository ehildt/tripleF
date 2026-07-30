const DEFAULT_CONVERSATION_TITLE = 'New Conversation';

/**
 * A conversation titled with the default placeholder adopts the first 50
 * characters of its first exchange's content. Once the title was changed
 * (or the exchange has no content) it stays as-is.
 */
export function inferConversationTitle(
  currentTitle: string,
  exchangeContent: string,
): string {
  if (currentTitle !== DEFAULT_CONVERSATION_TITLE) return currentTitle;
  return exchangeContent.slice(0, 50) || DEFAULT_CONVERSATION_TITLE;
}

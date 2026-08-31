/** Re-tag an exchange copy to the new conversation id. */
export function mapExchangeToNewSession<T extends { conversationId?: string }>(
  exchange: T,
  conversationId: string,
): T {
  return { ...exchange, conversationId };
}

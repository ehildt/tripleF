import type { Conversation } from '../../conversation.model';

/**
 * The request id of the most recent exchange that carries one, falling back
 * to the backend conversation id for conversations without exchanges.
 */
export function getLatestRequestId(conversation: Conversation): string {
  const latest = [...conversation.exchanges].reverse().find((e) => e.requestId);
  return latest?.requestId ?? conversation.conversationId;
}

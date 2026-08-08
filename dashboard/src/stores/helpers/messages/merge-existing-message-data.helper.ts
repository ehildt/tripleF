import type { MessageData } from '../../../types/message-data.model';

/**
 * Merge an incoming stream event into the data of an already-tracked
 * message: streamed content is appended, `pending` clears once content or
 * the final event arrives, `done` latches, the backend conversation id is
 * adopted when reported, and token statistics only latch on the final event.
 */
export function mergeExistingMessageData(
  existing: MessageData,
  incoming: MessageData,
): MessageData {
  const existingContent = existing.message?.content;
  const newContent = incoming.message?.content;

  return {
    ...existing,
    message: newContent
      ? { content: (existingContent || '') + newContent }
      : existing.message,
    pending:
      newContent || incoming.done === true ? undefined : existing.pending,
    done: incoming.done === true ? true : existing.done,
    conversationId: incoming.conversationId || existing.conversationId,
    promptEvalCount:
      incoming.done === true
        ? incoming.promptEvalCount
        : existing.promptEvalCount,
    evalCount: incoming.done === true ? incoming.evalCount : existing.evalCount,
  };
}

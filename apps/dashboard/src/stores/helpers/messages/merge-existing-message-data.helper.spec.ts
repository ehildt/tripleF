import { describe, expect, it } from 'vitest';

import type { MessageData } from '../../../types/message-data.model';
import { mergeExistingMessageData } from './merge-existing-message-data.helper';

describe('mergeExistingMessageData', () => {
  it('appends streamed content and clears pending', () => {
    const merged = mergeExistingMessageData(
      { pending: true, message: { content: 'Hello ' } } as MessageData,
      { message: { content: 'world' } } as MessageData,
    );

    expect(merged.message?.content).toBe('Hello world');
    expect(merged.pending).toBeUndefined();
  });

  it('keeps the existing message when no new content arrives', () => {
    const merged = mergeExistingMessageData(
      { message: { content: 'Hello' }, pending: true } as MessageData,
      {} as MessageData,
    );

    expect(merged.message?.content).toBe('Hello');
    expect(merged.pending).toBe(true);
  });

  it('latches done, adopts conversation id, and accepts final token stats', () => {
    const merged = mergeExistingMessageData(
      { pending: true } as MessageData,
      {
        done: true,
        conversationId: 'conv-9',
        promptEvalCount: 42,
        evalCount: 7,
      } as MessageData,
    );

    expect(merged.done).toBe(true);
    expect(merged.pending).toBeUndefined();
    expect(merged.conversationId).toBe('conv-9');
    expect(merged.promptEvalCount).toBe(42);
    expect(merged.evalCount).toBe(7);
  });

  it('ignores token stats and conversation id before the final event', () => {
    const merged = mergeExistingMessageData(
      { conversationId: 'conv-1', promptEvalCount: 5 } as MessageData,
      { conversationId: undefined, promptEvalCount: 999 } as MessageData,
    );

    expect(merged.conversationId).toBe('conv-1');
    expect(merged.promptEvalCount).toBe(5);
    expect(merged.evalCount).toBeUndefined();
  });
});

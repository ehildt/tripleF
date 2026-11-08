import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/chat/conversation/conversation.model';

import { buildAssistantCompletionPatch } from './build-assistant-completion-patch.helper';

function assistant(
  requestId: string,
  status: Exchange['status'],
  promptEvalCount?: number,
  evalCount?: number,
): Exchange {
  return {
    id: requestId,
    role: 'assistant',
    content: '',
    status,
    timestamp: 1,
    requestId,
    promptEvalCount,
    evalCount,
  };
}

describe('buildAssistantCompletionPatch', () => {
  it('calculates input delta with the target treated as completed', () => {
    const exchanges = [
      assistant('previous', 'done', 40, 10),
      assistant('current', 'streaming'),
    ];

    expect(
      buildAssistantCompletionPatch(exchanges, 'current', {
        promptEvalCount: 100,
        evalCount: 20,
      }),
    ).toEqual({
      status: 'done',
      promptEvalCount: 100,
      evalCount: 20,
      inputTokenDelta: 50,
    });
    expect(exchanges[1].status).toBe('streaming');
  });

  it('marks done without token fields when usage is absent', () => {
    expect(buildAssistantCompletionPatch([], 'current')).toEqual({
      status: 'done',
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

import type { HarnessContext } from '../harness-context.type.js';

import { VectorizeStepService } from './vectorize-step.service.js';

function makeContext(overrides: Partial<HarnessContext> = {}): HarnessContext {
  return {
    requestId: 'req-1',
    sessionId: 'sess-1',
    model: 'qwen3.8:27b',
    filters: { conversationId: 'conv-1' } as HarnessContext['filters'],
    lastUserPrompt: 'Hello',
    outputs: { finalContent: 'Hi there' },
    request: { messages: [], options: {}, model: 'model', keep_alive: '5m' },
    ...overrides,
  } as HarnessContext;
}

describe('VectorizeStepService', () => {
  it('enqueues both turn sides with the turn model and session scope', async () => {
    const enqueueTurn = vi.fn().mockResolvedValue(undefined);
    const step = new VectorizeStepService({ enqueueTurn } as never);

    await step.execute(makeContext());

    expect(enqueueTurn).toHaveBeenCalledWith({
      sessionId: 'sess-1',
      conversationId: 'conv-1',
      requestId: 'req-1',
      model: 'qwen3.8:27b',
      userText: 'Hello',
      assistantText: 'Hi there',
    });
  });

  it('passes a missing session id through (the enqueue service no-ops on it)', async () => {
    const enqueueTurn = vi.fn().mockResolvedValue(undefined);
    const step = new VectorizeStepService({ enqueueTurn } as never);

    await step.execute(makeContext({ sessionId: undefined }));

    expect(enqueueTurn).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: undefined, requestId: 'req-1' }),
    );
  });

  it('never fails the turn when the enqueue service throws', async () => {
    const enqueueTurn = vi.fn().mockRejectedValue(new Error('queue down'));
    const step = new VectorizeStepService({ enqueueTurn } as never);

    await expect(step.execute(makeContext())).resolves.toBeUndefined();
  });
});

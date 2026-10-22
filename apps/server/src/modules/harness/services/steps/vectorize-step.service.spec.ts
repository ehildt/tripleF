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

const sourceBudget = { config: {} } as never;

describe('VectorizeStepService', () => {
  it('enqueues both turn sides with the judged context when the turn gathered data', async () => {
    const enqueueTurn = vi.fn().mockResolvedValue(undefined);
    const step = new VectorizeStepService(
      { enqueueTurn } as never,
      sourceBudget,
    );

    await step.execute(
      makeContext({
        outputs: {
          finalContent: 'Hi there',
          toolResults: [
            { toolName: 'serperWebSearch', result: 'a result' },
            { toolName: 'memory-partition-recall', result: 'a memory hit' },
          ],
        } as HarnessContext['outputs'],
      }),
    );

    expect(enqueueTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-1',
        conversationId: 'conv-1',
        requestId: 'req-1',
        model: 'qwen3.8:27b',
        userText: 'Hello',
        assistantText: 'Hi there',
      }),
    );
    // Gathered data excludes the memory-tool results — they are memory
    // reads, not gathered content.
    const gathered = (enqueueTurn.mock.calls[0][0] as { gathered?: string })
      .gathered;
    expect(gathered).toContain('serperWebSearch');
    expect(gathered).not.toContain('memory-partition-recall');
  });

  it('suppresses the assistant side on pure-chat turns (no gathered data, no files)', async () => {
    const enqueueTurn = vi.fn().mockResolvedValue(undefined);
    const step = new VectorizeStepService(
      { enqueueTurn } as never,
      sourceBudget,
    );

    await step.execute(makeContext());

    expect(enqueueTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userText: 'Hello',
        assistantText: undefined,
        gathered: undefined,
      }),
    );
  });

  it('keeps the assistant side when the user attached files', async () => {
    const enqueueTurn = vi.fn().mockResolvedValue(undefined);
    const step = new VectorizeStepService(
      { enqueueTurn } as never,
      sourceBudget,
    );

    await step.execute(
      makeContext({
        files: [{ name: 'bauplan.pdf', url: 'https://files/bauplan.pdf' }],
      } as Partial<HarnessContext>),
    );

    expect(enqueueTurn).toHaveBeenCalledWith(
      expect.objectContaining({ assistantText: 'Hi there' }),
    );
  });

  it('passes a missing session id through (the enqueue service no-ops on it)', async () => {
    const enqueueTurn = vi.fn().mockResolvedValue(undefined);
    const step = new VectorizeStepService(
      { enqueueTurn } as never,
      sourceBudget,
    );

    await step.execute(makeContext({ sessionId: undefined }));

    expect(enqueueTurn).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: undefined, requestId: 'req-1' }),
    );
  });

  it('never fails the turn when the enqueue service throws', async () => {
    const enqueueTurn = vi.fn().mockRejectedValue(new Error('queue down'));
    const step = new VectorizeStepService(
      { enqueueTurn } as never,
      sourceBudget,
    );

    await expect(step.execute(makeContext())).resolves.toBeUndefined();
  });
});

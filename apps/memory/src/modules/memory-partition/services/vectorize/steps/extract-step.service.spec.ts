import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VectorizeContext } from '../vectorize-context.type.js';

import { ExtractStepService } from './extract-step.service.js';

function makeCtx(overrides: Partial<VectorizeContext> = {}): VectorizeContext {
  return {
    jobId: 'job-1',
    job: {} as never,
    memoryPartition: 'sess-1',
    sessionId: 'sess-1',
    role: 'user',
    text: 'User prefers single-line if statements.',
    model: 'qwen3.8:27b',
    steps: new Map(),
    outputs: {},
    done: false,
    ...overrides,
  };
}

function makeStep() {
  const generateChat = vi.fn();
  const step = new ExtractStepService(
    { generateChat } as never,
    { searchByText: vi.fn().mockResolvedValue([]) } as never,
    {
      resolveLabels: vi.fn().mockResolvedValue([]),
    } as never,
    {
      rankVocabulary: vi.fn().mockResolvedValue({}),
    } as never,
    { vectorizeTextRatio: 0.5, vectorizeTextChars: 0 } as never,
  );
  return { step, generateChat };
}

const conciseFact = {
  text: 'User prefers concise.',
  subject: 'user',
  kind: 'preference' as const,
  stability: 'durable' as const,
};

describe('ExtractStepService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('extracts facts and tags on the first pass', async () => {
    const { step, generateChat } = makeStep();
    generateChat.mockResolvedValue({
      text: JSON.stringify({
        facts: [conciseFact],
        tags: ['style'],
      }),
    });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(ctx.outputs.extraction).toEqual({
      facts: [conciseFact],
      tags: ['style'],
    });
    expect(generateChat).toHaveBeenCalledTimes(1);
  });

  it('tolerates fenced JSON from smarter chat models', async () => {
    const { step, generateChat } = makeStep();
    generateChat.mockResolvedValue({
      text: `\`\`\`json\n${JSON.stringify({ facts: [conciseFact], tags: ['work'] })}\n\`\`\``,
    });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(ctx.outputs.extraction).toEqual({
      facts: [conciseFact],
      tags: ['work'],
    });
  });

  it('runs one correction pass when the first output fails the schema', async () => {
    const { step, generateChat } = makeStep();
    generateChat
      .mockResolvedValueOnce({ text: '{"facts": "not-an-array"}' })
      .mockResolvedValueOnce({
        text: JSON.stringify({ facts: [conciseFact], tags: ['work'] }),
      });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(generateChat).toHaveBeenCalledTimes(2);
    // Correction attempt echoes the failed output plus the error instruction.
    const secondCallMessages = generateChat.mock.calls[1][0].messages as Array<{
      role: string;
      content: string;
    }>;
    expect(secondCallMessages[2]).toEqual({
      role: 'assistant',
      content: '{"facts": "not-an-array"}',
    });
    expect(secondCallMessages[3].content).toContain('not valid');
    expect(ctx.outputs.extraction).toEqual({
      facts: [{ ...conciseFact }],
      tags: ['work'],
    });
  });

  it('degrades to empty when correction still fails', async () => {
    const { step, generateChat } = makeStep();
    generateChat.mockResolvedValue({ text: 'not json at all' });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(generateChat).toHaveBeenCalledTimes(2);
    expect(ctx.outputs.extraction).toEqual({ facts: [], tags: [] });
  });

  it('degrades immediately when the LLM call itself fails', async () => {
    const { step, generateChat } = makeStep();
    generateChat.mockRejectedValue(new Error('model down'));

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(generateChat).toHaveBeenCalledTimes(1);
    expect(ctx.outputs.extraction).toEqual({ facts: [], tags: [] });
  });

  it('skips extraction entirely when the job carries no model', async () => {
    const { step, generateChat } = makeStep();
    const ctx = makeCtx({ model: undefined });

    await step.execute(ctx);

    expect(generateChat).not.toHaveBeenCalled();
    expect(ctx.outputs.extraction).toEqual({ facts: [], tags: [] });
  });
});

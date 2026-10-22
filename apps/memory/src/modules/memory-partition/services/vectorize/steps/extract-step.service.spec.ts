import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VectorizeContext } from '../vectorize-context.types.js';

import { ExtractStepService } from './extract-step.service.js';

function makeCtx(overrides: Partial<VectorizeContext> = {}): VectorizeContext {
  return {
    jobId: 'job-1',
    job: {} as never,
    memoryPartition: 'sess-1',
    sessionId: 'sess-1',
    role: 'user',
    text: 'Sam lives in Berlin.',
    model: 'qwen3.8:27b',
    steps: new Map(),
    outputs: {},
    done: false,
    ...overrides,
  };
}

function makeStep() {
  const generateWithTools = vi.fn();
  const step = new ExtractStepService(
    { generateWithTools } as never,
    { searchByText: vi.fn().mockResolvedValue([]) } as never,
    {
      resolveLabels: vi.fn().mockResolvedValue([]),
    } as never,
    {
      rankVocabulary: vi.fn().mockResolvedValue({}),
    } as never,
    { vectorizeTextRatio: 0.5, vectorizeTextChars: 0 } as never,
  );
  return { step, generateWithTools };
}

const berlinFact = {
  text: 'Sam lives in Berlin.',
  subject: 'sam',
  node: 'residence',
  category: 'people',
  community: 'contacts',
  kind: 'state' as const,
  stability: 'durable' as const,
};

describe('ExtractStepService', () => {
  beforeEach(() => vi.resetAllMocks());

  it('judges the turn worthy: verdict plus facts and tags on the first pass', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools.mockResolvedValue({
      text: JSON.stringify({
        remember: true,
        facts: [berlinFact],
        tags: ['style'],
      }),
    });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(ctx.outputs.extraction).toEqual({
      remember: true,
      facts: [berlinFact],
      tags: ['style'],
    });
    expect(generateWithTools).toHaveBeenCalledTimes(1);
  });

  it('passes an explicit remember=false verdict straight through', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools.mockResolvedValue({
      text: JSON.stringify({ remember: false, facts: [], tags: [] }),
    });

    const ctx = makeCtx({ text: 'find japanese dark trap music by katame' });
    await step.execute(ctx);

    expect(ctx.outputs.extraction).toEqual({
      remember: false,
      facts: [],
      tags: [],
    });
  });

  it('judges with the full turn context: attached files and gathered data ride the prompt', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools.mockResolvedValue({
      text: JSON.stringify({ remember: false, facts: [], tags: [] }),
    });

    const ctx = makeCtx({
      files: [{ name: 'bauplan.pdf', url: 'https://files/bauplan.pdf' }],
      gathered: '[serperWebSearch] top hits for katame',
    });
    await step.execute(ctx);

    const userMessage = (
      generateWithTools.mock.calls[0][0].messages as Array<{
        role: string;
        content: string;
      }>
    )[1];
    expect(userMessage.content).toContain('ATTACHED FILES');
    expect(userMessage.content).toContain('bauplan.pdf');
    expect(userMessage.content).toContain('GATHERED DATA');
    expect(userMessage.content).toContain('top hits for katame');
  });

  it('tolerates fenced JSON from smarter chat models', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools.mockResolvedValue({
      text: `\`\`\`json\n${JSON.stringify({ remember: true, facts: [berlinFact], tags: ['work'] })}\n\`\`\``,
    });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(ctx.outputs.extraction).toEqual({
      remember: true,
      facts: [berlinFact],
      tags: ['work'],
    });
  });

  it('runs one correction pass when the first output fails the schema', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools
      .mockResolvedValueOnce({
        text: '{"remember": true, "facts": "not-an-array"}',
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          remember: true,
          facts: [berlinFact],
          tags: ['work'],
        }),
      });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(generateWithTools).toHaveBeenCalledTimes(2);
    // Correction attempt echoes the failed output plus the error instruction.
    const secondCallMessages = generateWithTools.mock.calls[1][0]
      .messages as Array<{
      role: string;
      content: string;
    }>;
    expect(secondCallMessages[2]).toEqual({
      role: 'assistant',
      content: '{"remember": true, "facts": "not-an-array"}',
    });
    expect(secondCallMessages[3].content).toContain('not valid');
    expect(ctx.outputs.extraction).toEqual({
      remember: true,
      facts: [{ ...berlinFact }],
      tags: ['work'],
    });
  });

  it('degrades to empty when correction still fails', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools.mockResolvedValue({ text: 'not json at all' });

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(generateWithTools).toHaveBeenCalledTimes(2);
    expect(ctx.outputs.extraction).toEqual({
      remember: false,
      facts: [],
      tags: [],
    });
  });

  it('degrades immediately when the LLM call itself fails', async () => {
    const { step, generateWithTools } = makeStep();
    generateWithTools.mockRejectedValue(new Error('model down'));

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(generateWithTools).toHaveBeenCalledTimes(1);
    expect(ctx.outputs.extraction).toEqual({
      remember: false,
      facts: [],
      tags: [],
    });
  });

  it('skips extraction entirely when the job carries no model', async () => {
    const { step, generateWithTools } = makeStep();
    const ctx = makeCtx({ model: undefined });

    await step.execute(ctx);

    expect(generateWithTools).not.toHaveBeenCalled();
    expect(ctx.outputs.extraction).toEqual({
      remember: false,
      facts: [],
      tags: [],
    });
  });
});

import { describe, expect, it, vi } from 'vitest';

import type { VectorizeContext } from '../vectorize-context.type.js';

import { EmbedStepService } from './embed-step.service.js';

function makeCtx(overrides: Partial<VectorizeContext> = {}): VectorizeContext {
  return {
    jobId: 'job-1',
    job: {} as never,
    memoryPartition: 'sess-1',
    sessionId: 'sess-1',
    role: 'user',
    text: 'First sentence. Second sentence.',
    steps: new Map(),
    outputs: {},
    done: false,
    ...overrides,
  };
}

describe('EmbedStepService', () => {
  it('embeds the extracted facts in one document-side batch', async () => {
    const embed = vi
      .fn()
      .mockImplementation((inputs: string[]) =>
        Promise.resolve(inputs.map((_, i) => [i, 0, 1])),
      );
    const step = new EmbedStepService({ embed } as never);

    const ctx = makeCtx({
      outputs: {
        extraction: {
          facts: [
            {
              text: 'User prefers concise.',
              kind: 'preference' as const,
              stability: 'durable' as const,
            },
            {
              text: 'User uses vim.',
              kind: 'state' as const,
              stability: 'volatile' as const,
            },
          ],
          tags: ['style'],
        },
      },
    });

    await step.execute(ctx);

    expect(embed).toHaveBeenCalledWith(
      ['User prefers concise.', 'User uses vim.'],
      'document',
    );
    expect(ctx.outputs.vectors).toHaveLength(2);
  });

  it('no-ops when the turn produced no facts', async () => {
    const embed = vi.fn();
    const step = new EmbedStepService({ embed } as never);

    const ctx = makeCtx();
    await step.execute(ctx);

    expect(embed).not.toHaveBeenCalled();
    expect(ctx.outputs.vectors).toEqual([]);
  });

  it('throws when Ollama returns fewer vectors than inputs', async () => {
    const embed = vi.fn().mockResolvedValue([[0, 0, 1]]);
    const step = new EmbedStepService({ embed } as never);

    const ctx = makeCtx({
      outputs: {
        extraction: {
          facts: [
            {
              text: 'F1',
              kind: 'fact' as const,
              stability: 'durable' as const,
            },
            {
              text: 'F2',
              kind: 'fact' as const,
              stability: 'durable' as const,
            },
          ],
          tags: [],
        },
      },
    });

    await expect(step.execute(ctx)).rejects.toThrow(
      'returned 1 vectors for 2 inputs',
    );
  });
});

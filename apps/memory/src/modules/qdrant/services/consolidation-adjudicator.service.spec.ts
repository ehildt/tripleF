import { describe, expect, it, vi } from 'vitest';

import {
  type AdjudicationFact,
  ConsolidationAdjudicatorService,
} from './consolidation-adjudicator.service.js';

function makeService() {
  const generateChat = vi.fn();
  const service = new ConsolidationAdjudicatorService(
    { generateChat } as never,
    { config: { keepAlive: '5m' } } as never,
  );
  return { service, generateChat };
}

const fact: AdjudicationFact = {
  text: 'User likes dogs',
  role: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const candidates: AdjudicationFact[] = [
  {
    text: 'User likes dogs a lot',
    role: 'user',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('ConsolidationAdjudicatorService', () => {
  it('returns a parsed verdict from the LLM', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({
      text: JSON.stringify({
        verdict: 'merge',
        mergedText: 'User likes dogs a lot',
      }),
    });

    const verdict = await service.adjudicate('qwen3.8:27b', fact, candidates);

    expect(verdict).toEqual({
      verdict: 'merge',
      mergedText: 'User likes dogs a lot',
    });
    expect(generateChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'qwen3.8:27b' }),
    );
  });

  it('tolerates markdown fences around the verdict JSON', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({
      text: '```json\n{"verdict":"keep"}\n```',
    });

    expect(await service.adjudicate('m', fact, candidates)).toEqual({
      verdict: 'keep',
    });
  });

  it('returns undefined on empty output', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({ text: '  ' });

    expect(await service.adjudicate('m', fact, candidates)).toBeUndefined();
  });

  it('returns undefined on unparseable output', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({ text: 'not json at all' });

    expect(await service.adjudicate('m', fact, candidates)).toBeUndefined();
  });

  it('returns undefined on a schema violation', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({
      text: JSON.stringify({ verdict: 'nonsense' }),
    });

    expect(await service.adjudicate('m', fact, candidates)).toBeUndefined();
  });
});

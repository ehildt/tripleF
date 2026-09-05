import { describe, expect, it, vi } from 'vitest';

import { FrictionAdjudicatorService } from './friction-adjudicator.service.js';

function makeService() {
  const generateChat = vi.fn();
  const service = new FrictionAdjudicatorService(
    { generateChat } as never,
    { config: { keepAlive: '5m' } } as never,
  );
  return { service, generateChat };
}

const record = {
  id: 'p1',
  text: 'User likes dogs',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const candidates = [
  {
    id: 'p2',
    text: 'User dislikes dogs',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('FrictionAdjudicatorService', () => {
  it('returns a parsed verdict from the LLM', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({
      text: JSON.stringify({
        contradicts: true,
        conflictingId: 'p2',
        winnerId: 'p2',
        reason: 'later wins',
      }),
    });

    const verdict = await service.adjudicate('qwen3.8:27b', record, candidates);

    expect(verdict).toEqual({
      contradicts: true,
      conflictingId: 'p2',
      winnerId: 'p2',
      reason: 'later wins',
    });
    expect(generateChat).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'qwen3.8:27b' }),
    );
  });

  it('tolerates markdown fences around the verdict JSON', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({
      text: '```json\n{"contradicts":false}\n```',
    });

    expect(await service.adjudicate('m', record, candidates)).toEqual({
      contradicts: false,
    });
  });

  it('returns undefined on empty output', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({ text: '  ' });

    expect(await service.adjudicate('m', record, candidates)).toBeUndefined();
  });

  it('returns undefined on unparseable output', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({ text: 'not json at all' });

    expect(await service.adjudicate('m', record, candidates)).toBeUndefined();
  });

  it('returns undefined on a schema violation', async () => {
    const { service, generateChat } = makeService();
    generateChat.mockResolvedValue({
      text: JSON.stringify({ contradicts: 'yes' }),
    });

    expect(await service.adjudicate('m', record, candidates)).toBeUndefined();
  });
});

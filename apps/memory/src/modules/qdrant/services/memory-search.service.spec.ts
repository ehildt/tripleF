import { describe, expect, it, vi } from 'vitest';

import type { MemoryPoint } from '../models/memory.model.js';

import { MemorySearchService } from './memory-search.service.js';

function makeHit(id: string, score: number, text = id): MemoryPoint {
  return {
    id,
    score,
    text,
    role: 'user',
    memoryPartition: 'sess-1',
    sessionId: 'sess-1',
    tags: [],
    createdAt: '2026-08-21T08:00:00.000Z',
  };
}

function makeService() {
  const embed = vi.fn();
  const searchMemory = vi.fn().mockResolvedValue([] as MemoryPoint[]);
  const findByIds = vi.fn().mockResolvedValue([]);
  const service = new MemorySearchService(
    { embed } as never,
    { searchMemory } as never,
    { findByIds } as never,
    { searchSynopses: vi.fn().mockResolvedValue([]) } as never,
    { getRaptorEnabled: vi.fn().mockReturnValue(false) } as never,
  );
  return { service, embed, searchMemory, findByIds };
}

describe('MemorySearchService.searchByText', () => {
  it('embeds full text + sentence variants and merges by best score', async () => {
    const { service, embed, searchMemory } = makeService();
    // Variants: [full, 'Long question about memory.', 'Second part.']
    embed.mockImplementation((inputs: string[]) =>
      Promise.resolve(inputs.map((_, i) => (i === 0 ? [1, 0, 0] : [2, 0, 0]))),
    );
    // The full-text variant ranks A at 0.9; the sentence variants find B (0.8)
    // which the full-text query missed, and A again at a lower score.
    searchMemory.mockImplementation(
      async ({ vector }: { vector: number[] }) => {
        if (vector[0] === 1) return [makeHit('A', 0.9), makeHit('C', 0.7)];
        return [makeHit('A', 0.6), makeHit('B', 0.8)];
      },
    );

    const results = await service.searchByText({
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      text: 'Long question about memory. Second part.',
      limit: 3,
      tags: ['work'],
    });

    expect(embed).toHaveBeenCalledWith(expect.any(Array), 'query');
    // A appears twice → keeps the max score (0.9), sorted desc, top 3.
    expect(results.map((r) => r.id)).toEqual(['A', 'B', 'C']);
    expect(results[0].score).toBe(0.9);
    // Filters threaded into every variant search.
    expect(
      searchMemory.mock.calls.every(([input]) => input.tags?.[0] === 'work'),
    ).toBe(true);
    expect(searchMemory).toHaveBeenCalledTimes(3);
  });

  it('threads the category filter into every variant search', async () => {
    const { service, embed, searchMemory } = makeService();
    embed.mockResolvedValue([[1, 0, 0]]);
    searchMemory.mockResolvedValue([]);

    await service.searchByText({
      memoryPartition: 'sess-1',
      text: 'One sentence.',
      category: 'games',
    });

    expect(
      searchMemory.mock.calls.every(([input]) => input.category === 'games'),
    ).toBe(true);
  });

  it('degrades to empty when the embed fails', async () => {
    const { service, embed, searchMemory } = makeService();
    embed.mockRejectedValue(new Error('embed down'));

    expect(
      await service.searchByText({
        sessionId: 'sess-1',
        text: 'anything',
      }),
    ).toEqual([]);
    expect(searchMemory).not.toHaveBeenCalled();
  });

  it('degrades to empty on an embed count mismatch', async () => {
    const { service, embed, searchMemory } = makeService();
    embed.mockResolvedValue([[1, 0, 0]]); // one vector for two variants

    expect(
      await service.searchByText({
        sessionId: 'sess-1',
        text: 'Two sentences. Here.',
      }),
    ).toEqual([]);
    expect(searchMemory).not.toHaveBeenCalled();
  });

  it('returns nothing for blank input', async () => {
    const { service, embed } = makeService();
    expect(
      await service.searchByText({
        sessionId: 'sess-1',
        text: '  ',
      }),
    ).toEqual([]);
    expect(embed).not.toHaveBeenCalled();
  });
});

describe('MemorySearchService.searchByVector', () => {
  it('passes all filters to the repository search', async () => {
    const { service, searchMemory } = makeService();
    searchMemory.mockResolvedValue([makeHit('a', 0.7)]);

    await service.searchByVector({
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      vector: [1, 0, 0],
      role: 'user',
      conversationId: 'conv-9',
      tags: ['work'],
      contains: 'phone',
    });

    expect(searchMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPartition: 'sess-1',
        sessionId: 'sess-1',
        role: 'user',
        conversationId: 'conv-9',
        tags: ['work'],
        contains: 'phone',
      }),
    );
  });
});

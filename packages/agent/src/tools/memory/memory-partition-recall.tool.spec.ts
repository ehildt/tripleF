import { describe, expect, it, vi } from 'vitest';

import { createMemoryPartitionRecallTool } from './memory-partition-recall.tool.js';
import type { MemoryPoint } from './memory-point.model.js';

const scope = {
  memoryPartition: 'christopher',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

function makePoint(overrides: Partial<MemoryPoint>): MemoryPoint {
  return {
    id: 'p1',
    memoryPartition: 'christopher',
    sessionId: 'sess-1',
    role: 'user',
    text: 'record',
    tags: ['contacts'],
    createdAt: '2026-08-21T08:00:00.000Z',
    ...overrides,
  };
}

describe('createMemoryPartitionRecallTool', () => {
  it('searches with the partition scope, filters and topK, and renders the memory as attributable text', async () => {
    const searchByText = vi.fn().mockResolvedValue([
      makePoint({
        id: 'a',
        score: 0.82,
        text: 'Sams phone number is 555-1234',
      }),
      makePoint({
        id: 'b',
        score: 0.61,
        role: 'assistant',
        text: 'You asked about Sams number earlier.',
      }),
    ]);
    const tool = createMemoryPartitionRecallTool({ scope, searchByText });

    const result = (await tool.execute(
      { query: 'What is Sams number?', tags: ['contacts'], topK: 3 },
      {} as never,
    )) as string;

    expect(searchByText).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      text: 'What is Sams number?',
      tags: ['contacts'],
      contains: undefined,
      limit: 3,
    });
    expect(result).toContain('YOUR MEMORY OF THIS USER');
    expect(result).toContain('"Sams phone number is 555-1234"');
    expect(result).toContain('stated by the user');
    expect(result).toContain('stated by you (assistant)');
  });

  it('threads the contains filter through', async () => {
    const searchByText = vi.fn().mockResolvedValue([] as MemoryPoint[]);
    const tool = createMemoryPartitionRecallTool({ scope, searchByText });

    await tool.execute({ query: 'deployment', contains: 'prod' }, {} as never);

    expect(searchByText).toHaveBeenCalledWith(expect.objectContaining({ contains: 'prod' }));
  });

  it('returns a plain no-results note when nothing matches', async () => {
    const searchByText = vi.fn().mockResolvedValue([]);
    const tool = createMemoryPartitionRecallTool({ scope, searchByText });

    const result = (await tool.execute({ query: 'nothing here' }, {} as never)) as string;

    expect(result).toContain('No memories found');
  });
});

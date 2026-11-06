import { describe, expect, it, vi } from 'vitest';

import { MemoryReflectionRepository } from './memory-reflection.repository.js';
import type { QdrantClientService } from './qdrant-client.service.js';

const COLLECTION = 'harness_memory_nomic';

const buildRepository = (hasCollection = true) => {
  const client = {
    scroll: vi.fn(),
    query: vi.fn(),
  };
  const clientService = {
    collection: COLLECTION,
    hasCollection: vi.fn().mockResolvedValue(hasCollection),
    getClient: vi.fn(() => client),
    vectorLayout: vi.fn().mockResolvedValue({ named: true }),
  } as unknown as QdrantClientService;

  return {
    repository: new MemoryReflectionRepository(clientService),
    client,
  };
};

describe('MemoryReflectionRepository', () => {
  it('scrolls unreflected records and reads their dense vectors', async () => {
    const { repository, client } = buildRepository();
    client.scroll.mockResolvedValue({
      points: [
        {
          id: 7,
          vector: { dense: [0.1, 0.2] },
          payload: {
            text: 'Likes dogs',
            role: 'assistant',
            created_at: '2025-01-02',
            subject: 'dogs',
            kind: 'preference',
          },
        },
      ],
    });

    const points = await repository.scrollUnreflected({
      memoryPartition: 'p',
      tags: ['pets'],
      limit: 5,
    });

    expect(client.scroll).toHaveBeenCalledWith(COLLECTION, {
      filter: {
        must: [
          { key: 'memory_partition', match: { value: 'p' } },
          { key: 'tags', match: { any: ['pets'] } },
        ],
        must_not: [
          { key: 'is_reflected', match: { value: true } },
          { key: 'superseded', match: { value: true } },
        ],
      },
      limit: 5,
      with_payload: true,
      with_vector: true,
    });
    expect(points[0]).toMatchObject({
      id: '7',
      vector: [0.1, 0.2],
      text: 'Likes dogs',
      role: 'assistant',
      createdAt: '2025-01-02',
      subject: 'dogs',
      kind: 'preference',
    });
  });

  it('queries same-scope neighbors and maps sparse payloads', async () => {
    const { repository, client } = buildRepository();
    client.query.mockResolvedValue({ points: [{ id: 'neighbor-1' }] });

    const points = await repository.queryNeighborFacts({
      memoryCognition: 'person-1',
      vector: [0.3, 0.4],
      limit: 3,
      scoreThreshold: 0.4,
    });

    expect(client.query).toHaveBeenCalledWith(COLLECTION, {
      query: [0.3, 0.4],
      using: 'dense',
      limit: 3,
      score_threshold: 0.4,
      with_payload: true,
      filter: {
        must: [{ key: 'memory_cognition', match: { value: 'person-1' } }],
        must_not: [{ key: 'superseded', match: { value: true } }],
      },
    });
    expect(points).toEqual([
      expect.objectContaining({
        id: 'neighbor-1',
        text: '',
        role: 'user',
        createdAt: '',
      }),
    ]);
  });

  it('returns empty reads when the collection is unavailable', async () => {
    const { repository, client } = buildRepository(false);

    await expect(
      repository.scrollUnreflected({ memoryPartition: 'p', limit: 5 }),
    ).resolves.toEqual([]);
    await expect(
      repository.queryNeighborFacts({
        memoryPartition: 'p',
        vector: [0.1],
        limit: 3,
        scoreThreshold: 0.4,
      }),
    ).resolves.toEqual([]);
    expect(client.scroll).not.toHaveBeenCalled();
    expect(client.query).not.toHaveBeenCalled();
  });
});

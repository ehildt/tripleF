import { describe, expect, it, vi } from 'vitest';

import { MemorySynthesisRepository } from './memory-synthesis.repository.js';
import type { QdrantClientService } from './qdrant-client.service.js';

const COLLECTION = 'harness_memory_nomic';

const buildRepository = (hasCollection = true) => {
  const client = {
    scroll: vi.fn(),
    retrieve: vi.fn(),
  };
  const clientService = {
    collection: COLLECTION,
    hasCollection: vi.fn().mockResolvedValue(hasCollection),
    getClient: vi.fn(() => client),
  } as unknown as QdrantClientService;

  return {
    repository: new MemorySynthesisRepository(clientService),
    client,
    clientService,
  };
};

describe('MemorySynthesisRepository', () => {
  it('scrolls reflected evidence that has not been synthesized', async () => {
    const { repository, client } = buildRepository();
    client.scroll.mockResolvedValue({
      points: [
        {
          id: 'evidence-1',
          vector: { dense: [0.1, 0.2] },
          payload: {
            text: 'Likes dogs',
            role: 'user',
            created_at: '2025-01-02',
            category: 'pets',
          },
        },
      ],
    });

    const points = await repository.scrollSynthesizable({
      memoryPartition: 'p',
      limit: 10,
    });

    expect(client.scroll).toHaveBeenCalledWith(COLLECTION, {
      filter: {
        must: [
          { key: 'memory_partition', match: { value: 'p' } },
          { key: 'is_reflected', match: { value: true } },
        ],
        must_not: [
          { key: 'superseded', match: { value: true } },
          { key: 'is_synthesized', match: { value: true } },
          { key: 'tags', match: { any: ['bridge'] } },
        ],
      },
      limit: 10,
      with_payload: true,
      with_vector: true,
    });
    expect(points[0]).toMatchObject({
      id: 'evidence-1',
      vector: [0.1, 0.2],
      text: 'Likes dogs',
      category: 'pets',
    });
  });

  it('paginates every bridge and preserves evidence references', async () => {
    const { repository, client } = buildRepository();
    client.scroll
      .mockResolvedValueOnce({
        points: [{ id: 'bridge-1', payload: { evidence_ids: ['a'] } }],
        next_page_offset: 'page-2',
      })
      .mockResolvedValueOnce({
        points: [{ id: 'bridge-2' }],
        next_page_offset: null,
      });

    await expect(repository.scrollBridges('p')).resolves.toEqual([
      { id: 'bridge-1', evidenceIds: ['a'] },
      { id: 'bridge-2', evidenceIds: [] },
    ]);
    expect(client.scroll).toHaveBeenCalledTimes(2);
    expect(client.scroll.mock.calls[0][1]).toMatchObject({
      limit: 500,
      offset: undefined,
      filter: {
        must: [
          { key: 'memory_partition', match: { value: 'p' } },
          { key: 'tags', match: { any: ['bridge'] } },
        ],
      },
    });
    expect(client.scroll.mock.calls[1][1].offset).toBe('page-2');
  });

  it('uses the cognition scope and conviction tag', async () => {
    const { repository, client } = buildRepository();
    client.scroll.mockResolvedValue({ points: [], next_page_offset: null });

    await repository.scrollConvictions('person-1');

    expect(client.scroll).toHaveBeenCalledWith(
      COLLECTION,
      expect.objectContaining({
        filter: {
          must: [
            { key: 'memory_cognition', match: { value: 'person-1' } },
            { key: 'tags', match: { any: ['conviction'] } },
          ],
          must_not: [{ key: 'superseded', match: { value: true } }],
        },
      }),
    );
  });

  it('retrieves superseded states and skips an empty id list', async () => {
    const { repository, client, clientService } = buildRepository();
    client.retrieve.mockResolvedValue([
      { id: 'a', payload: { superseded: true } },
      { id: 'b', payload: {} },
    ]);

    await expect(repository.retrieveSupersededState([])).resolves.toEqual([]);
    expect(clientService.hasCollection).not.toHaveBeenCalled();

    await expect(
      repository.retrieveSupersededState(['a', 'b']),
    ).resolves.toEqual([
      { id: 'a', superseded: true },
      { id: 'b', superseded: false },
    ]);
    expect(client.retrieve).toHaveBeenCalledWith(COLLECTION, {
      ids: ['a', 'b'],
      with_payload: true,
    });
  });
});

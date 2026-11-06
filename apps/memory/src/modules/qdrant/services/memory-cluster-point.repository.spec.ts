import { describe, expect, it, vi } from 'vitest';

import { MemoryClusterPointRepository } from './memory-cluster-point.repository.js';
import type { QdrantClientService } from './qdrant-client.service.js';

const COLLECTION = 'harness_memory_nomic';

const buildRepository = (hasCollection = true) => {
  const client = {
    scroll: vi.fn(),
    setPayload: vi.fn(),
  };
  const clientService = {
    collection: COLLECTION,
    hasCollection: vi.fn().mockResolvedValue(hasCollection),
    getClient: vi.fn(() => client),
  } as unknown as QdrantClientService;

  return {
    repository: new MemoryClusterPointRepository(clientService),
    client,
    clientService,
  };
};

describe('MemoryClusterPointRepository', () => {
  it('paginates scope points, skips missing vectors, and enforces the limit', async () => {
    const { repository, client } = buildRepository();
    client.scroll
      .mockResolvedValueOnce({
        points: [
          {
            id: 'a',
            vector: { dense: [0.1] },
            payload: { text: 'First', tags: ['one'] },
          },
          { id: 'missing-vector', payload: { text: 'Skip me' } },
        ],
        next_page_offset: 'page-2',
      })
      .mockResolvedValueOnce({
        points: [
          {
            id: 'b',
            vector: [0.2],
            payload: { text: 'Second', category: 'examples' },
          },
        ],
        next_page_offset: 'unused-page',
      });

    const points = await repository.scrollScopePoints('p', 2);

    expect(points).toEqual([
      { id: 'a', vector: [0.1], text: 'First', tags: ['one'] },
      {
        id: 'b',
        vector: [0.2],
        text: 'Second',
        category: 'examples',
        tags: [],
      },
    ]);
    expect(client.scroll).toHaveBeenCalledTimes(2);
    expect(client.scroll.mock.calls[0][1]).toMatchObject({
      limit: 2,
      offset: undefined,
      with_payload: true,
      with_vector: true,
      filter: {
        must: [{ key: 'memory_partition', match: { value: 'p' } }],
        must_not: [{ key: 'superseded', match: { value: true } }],
      },
    });
    expect(client.scroll.mock.calls[1][1]).toMatchObject({
      limit: 1,
      offset: 'page-2',
    });
  });

  it('returns no points when the collection is unavailable', async () => {
    const { repository, client } = buildRepository(false);

    await expect(repository.scrollScopePoints('p', 10)).resolves.toEqual([]);
    expect(client.scroll).not.toHaveBeenCalled();
  });

  it('groups point assignments by cluster before writing payloads', async () => {
    const { repository, client, clientService } = buildRepository();

    await repository.setClusterIds(new Map());
    expect(clientService.hasCollection).not.toHaveBeenCalled();

    await repository.setClusterIds(
      new Map([
        ['point-a', 'cluster-1'],
        ['point-b', 'cluster-2'],
        ['point-c', 'cluster-1'],
      ]),
    );

    expect(client.setPayload).toHaveBeenCalledTimes(2);
    expect(client.setPayload).toHaveBeenNthCalledWith(1, COLLECTION, {
      payload: { cluster_id: 'cluster-1' },
      points: ['point-a', 'point-c'],
      wait: true,
    });
    expect(client.setPayload).toHaveBeenNthCalledWith(2, COLLECTION, {
      payload: { cluster_id: 'cluster-2' },
      points: ['point-b'],
      wait: true,
    });
  });
});

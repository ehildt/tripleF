import { describe, expect, it, vi } from 'vitest';

import type { MemoryFrictionRepository } from '../../persistence/services/memory-friction.repository.js';
import type { MemoryLinkRepository } from '../../persistence/services/memory-link.repository.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { MemoryRepository } from './memory.repository.js';
import type { MemoryOverridesService } from './memory-overrides.service.js';
import type { QdrantClientService } from './qdrant-client.service.js';

const COLLECTION = 'harness_memory_nomic';

const buildRepository = (options: { hasCollection?: boolean } = {}) => {
  const client = {
    scroll: vi.fn().mockResolvedValue({ points: [], next_page_offset: null }),
    facet: vi.fn().mockResolvedValue({ hits: [] }),
    delete: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({ points: [] }),
    upsert: vi.fn(),
    retrieve: vi.fn(),
    count: vi.fn().mockResolvedValue({ count: 0 }),
    setPayload: vi.fn(),
  };
  const clientService = {
    collection: COLLECTION,
    hasCollection: vi.fn().mockResolvedValue(options.hasCollection ?? true),
    getClient: vi.fn(() => client),
    vectorLayout: vi.fn().mockResolvedValue({ named: true }),
  } as unknown as QdrantClientService;
  const overrides = {
    getConstellationNodeLimit: vi.fn(() => 5000),
    getHeatTrackingEnabled: vi.fn(() => true),
  } as unknown as MemoryOverridesService;
  const links = {
    listEdges: vi.fn().mockResolvedValue([]),
    deleteByScope: vi.fn().mockResolvedValue(undefined),
    deleteByPointIds: vi.fn().mockResolvedValue(undefined),
    upsertEdges: vi.fn().mockResolvedValue(undefined),
  };
  const frictions = {
    listFrictions: vi.fn().mockResolvedValue([]),
    deleteByScope: vi.fn().mockResolvedValue(undefined),
    deleteByPointIds: vi.fn().mockResolvedValue(undefined),
  };
  const config = { linkReadMax: 250 } as QdrantConfig;

  const repository = new MemoryRepository(
    clientService,
    overrides,
    links as unknown as MemoryLinkRepository,
    frictions as unknown as MemoryFrictionRepository,
    config,
  );

  return { repository, client, clientService, links, frictions, overrides };
};

describe('MemoryRepository reads', () => {
  describe('without a collection', () => {
    it('returns empty results instead of failing', async () => {
      const { repository, client } = buildRepository({ hasCollection: false });

      await expect(
        repository.listMemory({ memoryPartition: 'p' } as never),
      ).resolves.toEqual([]);
      await expect(repository.facetCategories('p')).resolves.toEqual([]);
      await expect(repository.facetPartitions()).resolves.toEqual([]);
      await expect(repository.facetTags('p')).resolves.toEqual([]);
      await expect(
        repository.countByLabel('p', 'category', 'games'),
      ).resolves.toBe(0);
      await expect(
        repository.deleteByConversation({
          memoryPartition: 'p',
          conversationId: 'c',
        }),
      ).resolves.toBe(0);
      expect(client.scroll).not.toHaveBeenCalled();
    });
  });

  describe('listMemory', () => {
    it('scrolls the space newest-first and maps the points', async () => {
      const { repository, client } = buildRepository();
      client.scroll.mockResolvedValue({
        points: [
          {
            id: 7,
            payload: {
              memory_partition: 'p',
              text: 'Likes dogs',
              tags: ['pets'],
              node: 'health',
              created_at: '2025-01-02',
            },
          },
        ],
      });

      const points = await repository.listMemory({
        memoryPartition: 'p',
        limit: 10,
      } as never);

      expect(client.scroll).toHaveBeenCalledWith(COLLECTION, {
        filter: {
          must: [{ key: 'memory_partition', match: { value: 'p' } }],
        },
        limit: 10,
        with_payload: true,
        with_vector: false,
        order_by: { key: 'created_at', direction: 'desc' },
      });
      expect(points[0]).toMatchObject({
        id: '7',
        text: 'Likes dogs',
        tags: ['pets'],
        node: 'health',
      });
    });

    it('defaults the limit to the constellation node limit', async () => {
      const { repository, client, overrides } = buildRepository();
      client.scroll.mockResolvedValue({ points: [] });

      await repository.listMemory({ memoryPartition: 'p' } as never);

      expect(overrides.getConstellationNodeLimit).toHaveBeenCalled();
      expect(client.scroll.mock.calls[0][1].limit).toBe(5000);
    });

    it('fills defaults for a sparse payload', async () => {
      const { repository, client } = buildRepository();
      client.scroll.mockResolvedValue({ points: [{ id: 'x' }] });

      const [point] = await repository.listMemory({
        memoryPartition: 'p',
      } as never);

      expect(point).toMatchObject({
        id: 'x',
        text: '',
        tags: [],
        createdAt: '',
      });
    });
  });

  describe('taxonomy chains', () => {
    it('reads canonical hierarchy fields without vectors', async () => {
      const { repository, client } = buildRepository();
      client.scroll.mockResolvedValue({
        points: [
          {
            id: 'p1',
            payload: {
              category: 'games',
              community: 'action',
              subject: 'alpha',
              node: 'status',
              tags: ['work'],
            },
          },
        ],
      });

      const points = await repository.listTaxonomyChains('p');

      expect(points).toEqual([
        {
          category: 'games',
          community: 'action',
          hub: 'alpha',
          node: 'status',
          tags: ['work'],
        },
      ]);
      expect(client.scroll).toHaveBeenCalledWith(
        COLLECTION,
        expect.objectContaining({
          with_payload: ['category', 'community', 'subject', 'node', 'tags'],
          with_vector: false,
        }),
      );
    });
  });

  describe('facets', () => {
    it('maps category facet hits to string values with counts', async () => {
      const { repository, client } = buildRepository();
      client.facet.mockResolvedValue({ hits: [{ value: 'games', count: 12 }] });

      await expect(repository.facetCategories('p')).resolves.toEqual([
        { value: 'games', count: 12 },
      ]);
      expect(client.facet).toHaveBeenCalledWith(COLLECTION, {
        key: 'category',
        limit: 1000,
        exact: true,
        filter: { must: [{ key: 'memory_partition', match: { value: 'p' } }] },
      });
    });

    it('reads partition values without a filter', async () => {
      const { repository, client } = buildRepository();
      client.facet.mockResolvedValue({ hits: [{ value: 'sess-1', count: 3 }] });

      await expect(repository.facetPartitions()).resolves.toEqual(['sess-1']);
      expect(client.facet).toHaveBeenCalledWith(COLLECTION, {
        key: 'memory_partition',
        limit: 1000,
        exact: true,
      });
    });

    it('reads tag values of one partition', async () => {
      const { repository, client } = buildRepository();
      client.facet.mockResolvedValue({ hits: [{ value: 'pets', count: 2 }] });

      await expect(repository.facetTags('p')).resolves.toEqual([
        { value: 'pets', count: 2 },
      ]);
    });
  });

  describe('countByLabel', () => {
    it('matches tag arrays by containment', async () => {
      const { repository, client } = buildRepository();
      client.count.mockResolvedValue({ count: 4 });

      await expect(repository.countByLabel('p', 'tags', 'pets')).resolves.toBe(
        4,
      );
      expect(client.count).toHaveBeenCalledWith(
        COLLECTION,
        expect.objectContaining({
          exact: true,
          filter: expect.objectContaining({
            must: expect.arrayContaining([
              { key: 'tags', match: { any: ['pets'] } },
            ]),
          }),
        }),
      );
    });

    it('matches scalar labels by value', async () => {
      const { repository, client } = buildRepository();
      client.count.mockResolvedValue({ count: 2 });

      await repository.countByLabel('p', 'category', 'games');

      expect(client.count.mock.calls[0][1].filter.must).toContainEqual({
        key: 'category',
        match: { value: 'games' },
      });
    });
  });

  describe('deletion', () => {
    it('resolves matching ids across pages, then cascades the edges', async () => {
      const { repository, client, links, frictions } = buildRepository();
      client.scroll
        .mockResolvedValueOnce({
          points: [{ id: 'a' }],
          next_page_offset: 'page-2',
        })
        .mockResolvedValueOnce({
          points: [{ id: 'b' }],
          next_page_offset: null,
        });

      const deleted = await repository.deleteByConversation({
        memoryPartition: 'p',
        conversationId: 'c',
      });

      expect(deleted).toBe(2);
      expect(client.scroll).toHaveBeenCalledTimes(2);
      expect(client.delete).toHaveBeenCalledWith(COLLECTION, {
        points: ['a', 'b'],
        wait: true,
      });
      expect(links.deleteByPointIds).toHaveBeenCalledWith(['a', 'b']);
      expect(frictions.deleteByPointIds).toHaveBeenCalledWith(['a', 'b']);
    });

    it('skips the delete when nothing matches', async () => {
      const { repository, client } = buildRepository();
      client.scroll.mockResolvedValue({ points: [], next_page_offset: null });

      await expect(
        repository.deleteByConversation({
          memoryPartition: 'p',
          conversationId: 'c',
        }),
      ).resolves.toBe(0);
      expect(client.delete).not.toHaveBeenCalled();
    });

    it('wipes a partition and its stored edges', async () => {
      const { repository, client, links, frictions } = buildRepository();
      client.scroll.mockResolvedValue({
        points: [{ id: 'a' }],
        next_page_offset: null,
      });

      await expect(repository.deletePartitionData('p')).resolves.toBe(1);
      expect(links.deleteByScope).toHaveBeenCalledWith(
        'partition',
        COLLECTION,
        'p',
      );
      expect(frictions.deleteByScope).toHaveBeenCalledWith(
        'partition',
        COLLECTION,
        'p',
      );
    });

    it('does nothing for an empty id list', async () => {
      const { repository, client, links } = buildRepository();

      await repository.deleteByIds([]);

      expect(client.delete).not.toHaveBeenCalled();
      expect(links.deleteByPointIds).not.toHaveBeenCalled();
    });
  });

  describe('links', () => {
    it('delegates friction reads with the configured read limit', async () => {
      const { repository, frictions } = buildRepository();

      await repository.listFrictions('partition', 's');

      expect(frictions.listFrictions).toHaveBeenCalledWith(
        'partition',
        COLLECTION,
        's',
        250,
      );
    });

    it('returns stored edges without a backfill', async () => {
      const { repository, links, client } = buildRepository();
      const edges = [
        { source: 'a', target: 'b', score: 0.9, kind: 'semantic' },
      ];
      links.listEdges.mockResolvedValue(edges as never);

      await expect(repository.listLinks('partition', 's')).resolves.toEqual(
        edges,
      );
      expect(client.query).not.toHaveBeenCalled();
    });

    it('backfills once for an edge-less scope and re-reads', async () => {
      const { repository, links, client } = buildRepository();
      links.listEdges
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { source: 'a', target: 'b', score: 0.9, kind: 'semantic' },
        ] as never);

      const edges = await repository.listLinks('partition', 's');

      expect(edges).toHaveLength(1);
      // Backfill scrolled the scope's points once.
      expect(client.scroll).toHaveBeenCalledTimes(1);
    });

    it('does not backfill the same scope twice', async () => {
      const { repository, client } = buildRepository();

      await repository.listLinks('partition', 's');
      const afterFirst = client.scroll.mock.calls.length;
      await repository.listLinks('partition', 's');

      expect(client.scroll.mock.calls.length).toBe(afterFirst);
    });

    it('recomputes links by purging then backfilling the scope', async () => {
      const { repository, links, client } = buildRepository();

      await repository.recomputeLinks('partition', 's');

      expect(links.deleteByScope).toHaveBeenCalledWith(
        'partition',
        COLLECTION,
        's',
      );
      expect(client.scroll).toHaveBeenCalled();
      expect(links.listEdges).toHaveBeenCalled();
    });

    it('skips the backfill when the collection is missing', async () => {
      const { repository, client } = buildRepository({ hasCollection: false });

      await expect(
        repository.recomputeLinks('partition', 's'),
      ).resolves.toEqual([]);
      expect(client.scroll).not.toHaveBeenCalled();
    });
  });
});

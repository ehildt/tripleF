import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MemoryFrictionRepository } from '../../persistence/services/memory-friction.repository.js';
import type { MemoryLinkRepository } from '../../persistence/services/memory-link.repository.js';
import type { UpsertBatchInput } from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { MemoryGraphRepository } from './memory-graph.repository.js';
import { MemoryLabelRepository } from './memory-label.repository.js';
import type { MemoryOverridesService } from './memory-overrides.service.js';
import { MemoryRecordRepository } from './memory-record.repository.js';
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
  const vectorLayout = vi.fn().mockResolvedValue({ named: true });
  const clientService = {
    collection: COLLECTION,
    hasCollection: vi.fn().mockResolvedValue(options.hasCollection ?? true),
    getClient: vi.fn(() => client),
    vectorLayout,
  } as unknown as QdrantClientService;
  const overrides = {
    getConstellationNodeLimit: vi.fn(() => 5000),
    getHeatTrackingEnabled: vi.fn(() => true),
    getEpisodeScoreThreshold: vi.fn(() => 0.1),
    getEpisodeRecencyWeight: vi.fn(() => 0.3),
    getEpisodeRecencyScaleSeconds: vi.fn(() => 604800),
    getEpisodeRecencyMidpoint: vi.fn(() => 0.5),
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
  const config = {
    linkReadMax: 250,
    scoreThreshold: 0.3,
    hybridEnabled: true,
    hybridFusion: 'rrf',
    hybridDenseWeight: 1,
    hybridSparseWeight: 1,
    hybridSparseLimit: 50,
  } as QdrantConfig;

  const graphRepository = new MemoryGraphRepository(
    clientService,
    links as unknown as MemoryLinkRepository,
    frictions as unknown as MemoryFrictionRepository,
    config,
  );
  const repository = new MemoryRecordRepository(
    clientService,
    overrides,
    graphRepository,
    config,
  );
  const labelRepository = new MemoryLabelRepository(clientService);

  return {
    repository,
    labelRepository,
    graphRepository,
    client,
    clientService,
    vectorLayout,
    links,
    frictions,
    overrides,
  };
};

describe('Memory record, label, and graph repositories', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('without a collection', () => {
    it('returns empty results instead of failing', async () => {
      const { repository, labelRepository, client } = buildRepository({
        hasCollection: false,
      });

      await expect(
        repository.listMemory({ memoryPartition: 'p' } as never),
      ).resolves.toEqual([]);
      await expect(labelRepository.facetCategories('p')).resolves.toEqual([]);
      await expect(labelRepository.facetPartitions()).resolves.toEqual([]);
      await expect(labelRepository.facetTags('p')).resolves.toEqual([]);
      await expect(
        labelRepository.countByLabel('p', 'category', 'games'),
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

  describe('searchMemory', () => {
    it('combines dense and sparse prefetches for hybrid text search', async () => {
      const { repository, client, vectorLayout } = buildRepository();
      vectorLayout.mockResolvedValue({ named: true, sparse: true });
      client.query.mockResolvedValue({
        points: [
          {
            id: 'memory-1',
            score: 0.8,
            payload: { text: 'Likes dogs', tags: ['pets'] },
          },
        ],
      });

      const points = await repository.searchMemory({
        memoryPartition: 'p',
        vector: [0.1, 0.2],
        text: 'dogs',
        limit: 2,
      });

      const request = client.query.mock.calls[0][1];
      expect(request.prefetch.prefetch).toHaveLength(2);
      expect(request.prefetch.prefetch[0]).toMatchObject({
        query: [0.1, 0.2],
        using: 'dense',
        score_threshold: 0.3,
      });
      expect(request.prefetch.prefetch[1]).toMatchObject({
        using: 'sparse',
        limit: 50,
      });
      expect(request.prefetch.prefetch[1].query.indices).not.toHaveLength(0);
      expect(request.limit).toBe(2);
      expect(points[0]).toMatchObject({
        id: 'memory-1',
        text: 'Likes dogs',
        score: 0.8,
      });
    });

    it('uses dense-only recency scoring with the configured decay', async () => {
      const { repository, client, overrides } = buildRepository();
      client.query.mockResolvedValue({ points: [] });

      await repository.searchMemory({
        memoryPartition: 'p',
        vector: [0.1, 0.2],
        text: 'recent episodes',
        recency: true,
        limit: 3,
      });

      const request = client.query.mock.calls[0][1];
      expect(request.prefetch).toMatchObject({
        query: [0.1, 0.2],
        using: 'dense',
        score_threshold: 0.1,
        limit: 20,
      });
      expect(request.query.formula.sum[1].mult[0]).toBe(0.3);
      expect(request.query.formula.sum[1].mult[1].exp_decay).toMatchObject({
        x: { datetime_key: 'created_at' },
        scale: 604800,
        midpoint: 0.5,
      });
      expect(overrides.getEpisodeRecencyWeight).toHaveBeenCalled();
      expect(overrides.getEpisodeRecencyScaleSeconds).toHaveBeenCalled();
      expect(overrides.getEpisodeRecencyMidpoint).toHaveBeenCalled();
    });
  });

  describe('upsertBatch', () => {
    const input: UpsertBatchInput = {
      memoryPartition: 'p',
      role: 'user',
      points: [
        {
          id: 'memory-1',
          vector: [0.1, 0.2],
          text: 'Likes dogs',
          tags: ['pets'],
        },
      ],
    };

    it('upserts records and synchronizes their graph links', async () => {
      const { repository, graphRepository, client } = buildRepository();
      const syncLinks = vi
        .spyOn(graphRepository, 'syncLinks')
        .mockResolvedValue(undefined);

      await repository.upsertBatch(input);

      expect(client.upsert).toHaveBeenCalledWith(COLLECTION, {
        wait: true,
        points: [
          expect.objectContaining({
            id: 'memory-1',
            vector: { dense: [0.1, 0.2] },
            payload: expect.objectContaining({
              memory_partition: 'p',
              text: 'Likes dogs',
              tags: ['pets'],
              created_at: expect.any(String),
            }),
          }),
        ],
      });
      expect(syncLinks).toHaveBeenCalledWith('partition', 'p', input.points);
    });

    it('keeps the record write successful when graph sync fails', async () => {
      const { repository, graphRepository, client } = buildRepository();
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const syncLinks = vi
        .spyOn(graphRepository, 'syncLinks')
        .mockRejectedValue(new Error('graph unavailable'));

      await expect(repository.upsertBatch(input)).resolves.toBeUndefined();

      expect(client.upsert).toHaveBeenCalledOnce();
      expect(syncLinks).toHaveBeenCalledOnce();
    });
  });

  describe('facets', () => {
    it('maps category facet hits to string values with counts', async () => {
      const { labelRepository: repository, client } = buildRepository();
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
      const { labelRepository: repository, client } = buildRepository();
      client.facet.mockResolvedValue({ hits: [{ value: 'sess-1', count: 3 }] });

      await expect(repository.facetPartitions()).resolves.toEqual(['sess-1']);
      expect(client.facet).toHaveBeenCalledWith(COLLECTION, {
        key: 'memory_partition',
        limit: 1000,
        exact: true,
      });
    });

    it('reads tag values of one partition', async () => {
      const { labelRepository: repository, client } = buildRepository();
      client.facet.mockResolvedValue({ hits: [{ value: 'pets', count: 2 }] });

      await expect(repository.facetTags('p')).resolves.toEqual([
        { value: 'pets', count: 2 },
      ]);
    });
  });

  describe('countByLabel', () => {
    it('matches tag arrays by containment', async () => {
      const { labelRepository: repository, client } = buildRepository();
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
      const { labelRepository: repository, client } = buildRepository();
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
      const { graphRepository: repository, frictions } = buildRepository();

      await repository.listFrictions('partition', 's');

      expect(frictions.listFrictions).toHaveBeenCalledWith(
        'partition',
        COLLECTION,
        's',
        250,
      );
    });

    it('returns stored edges without a backfill', async () => {
      const { graphRepository: repository, links, client } = buildRepository();
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
      const { graphRepository: repository, links, client } = buildRepository();
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
      const { graphRepository: repository, client } = buildRepository();

      await repository.listLinks('partition', 's');
      const afterFirst = client.scroll.mock.calls.length;
      await repository.listLinks('partition', 's');

      expect(client.scroll.mock.calls.length).toBe(afterFirst);
    });

    it('recomputes links by purging then backfilling the scope', async () => {
      const { graphRepository: repository, links, client } = buildRepository();

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
      const { graphRepository: repository, client } = buildRepository({
        hasCollection: false,
      });

      await expect(
        repository.recomputeLinks('partition', 's'),
      ).resolves.toEqual([]);
      expect(client.scroll).not.toHaveBeenCalled();
    });
  });
});

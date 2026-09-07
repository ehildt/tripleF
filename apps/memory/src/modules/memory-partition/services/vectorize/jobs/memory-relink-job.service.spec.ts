import { describe, expect, it, vi } from 'vitest';

import type { QdrantConfig } from '../../../../qdrant/models/qdrant-config.model.js';

import { MemoryRelinkJobService } from './memory-relink-job.service.js';

const config = {
  linkNeighbors: 3,
  linkScoreThreshold: 0.7,
  linkTopicalThreshold: 0.6,
} as QdrantConfig;

function makeService() {
  const adjudicator = { adjudicate: vi.fn() };
  const aiSdkService = { generateChat: vi.fn() };
  const ollamaConfigService = { config: { keepAlive: '5m' } };
  const memorySearch = { searchByText: vi.fn() };
  const memoryRepository = {
    collection: 'harness_memory_nomic',
    facetCategories: vi.fn(),
    collapseCategory: vi.fn(),
    scrollCategoryPoints: vi.fn(),
    queryNeighbors: vi.fn(),
    setPayloadForPoints: vi.fn(),
    upsertBatch: vi.fn(),
    deleteByIds: vi.fn(),
  };
  const embeddingService = { embed: vi.fn() };
  const links = { deleteByKind: vi.fn(), upsertEdges: vi.fn() };
  const memoryEnqueue = { enqueueClusterJob: vi.fn() };
  const overrides = {
    getClusterAutoEnabled: vi.fn().mockReturnValue(false),
    getClusterModel: vi.fn(),
    getClusterMinMembers: vi.fn(),
  };
  const taxonomyProbe = { rankVocabulary: vi.fn().mockResolvedValue({}) };
  const service = new MemoryRelinkJobService(
    adjudicator as never,
    aiSdkService as never,
    ollamaConfigService as never,
    memorySearch as never,
    memoryRepository as never,
    embeddingService as never,
    links as never,
    memoryEnqueue as never,
    overrides as never,
    {
      resolveAlias: vi.fn().mockResolvedValue(undefined),
      listNodes: vi.fn().mockResolvedValue([]),
      insertAlias: vi.fn().mockResolvedValue(undefined),
      touchMaintenanceForLabels: vi.fn().mockResolvedValue(undefined),
    } as never,
    taxonomyProbe as never,
    config,
  );
  return {
    service,
    adjudicator,
    aiSdkService,
    memorySearch,
    memoryRepository,
    embeddingService,
    links,
    memoryEnqueue,
    overrides,
  };
}

const jobData = {
  memoryPartition: 'christopher',
  model: 'qwen3.8:27b',
};

const point = {
  id: 'p1',
  vector: [1, 0, 0],
  text: 'User likes dogs',
  role: 'user' as const,
  tags: ['pets'],
  createdAt: '2026-01-01T00:00:00.000Z',
  requestId: 'req-1',
};

describe('MemoryRelinkJobService', () => {
  it('collapses identical category variants to the canonical form', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'PDF', count: 2 },
      { value: 'pdf', count: 3 },
      { value: 'games', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockResolvedValue([]);
    memoryRepository.queryNeighbors.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.collapseCategory).toHaveBeenCalledWith(
      'christopher',
      'PDF',
      'pdf',
    );
    expect(memoryRepository.collapseCategory).toHaveBeenCalledTimes(1);
  });

  it('deletes a point adjudicated redundant within its category', async () => {
    const { service, adjudicator, memorySearch, memoryRepository } =
      makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'pets', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockResolvedValue([point]);
    memorySearch.searchByText.mockResolvedValue([
      { ...point, id: 'p2', text: 'User likes dogs a lot' },
    ]);
    adjudicator.adjudicate.mockResolvedValue({ verdict: 'redundant' });
    memoryRepository.queryNeighbors.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.deleteByIds).toHaveBeenCalledWith(['p1']);
  });

  it('merges with the category preserved on the new point', async () => {
    const {
      service,
      adjudicator,
      memorySearch,
      memoryRepository,
      embeddingService,
    } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'pets', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockResolvedValue([point]);
    memorySearch.searchByText.mockResolvedValue([
      { ...point, id: 'p2', text: 'User likes dogs a lot' },
    ]);
    adjudicator.adjudicate.mockResolvedValue({
      verdict: 'merge',
      mergedText: 'User likes dogs a lot',
    });
    embeddingService.embed.mockResolvedValue([[1, 0, 0]]);
    memoryRepository.queryNeighbors.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryRepository.upsertBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryPartition: 'christopher',
        points: [
          expect.objectContaining({
            text: 'User likes dogs a lot',
            category: 'pets',
            tags: ['pets'],
          }),
        ],
      }),
    );
    expect(memoryRepository.deleteByIds).toHaveBeenCalledWith(['p1', 'p2']);
  });

  it('writes topical edges and purges the previous topical set', async () => {
    const { service, memoryRepository, links, memorySearch } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'pets', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockResolvedValue([point]);
    memorySearch.searchByText.mockResolvedValue([]);
    memoryRepository.queryNeighbors.mockResolvedValue([
      { id: 'p2', score: 0.65, category: 'pets', tags: ['pets'] },
    ]);

    await service.execute(jobData);

    expect(links.deleteByKind).toHaveBeenCalledWith(
      'partition',
      'harness_memory_nomic',
      'christopher',
      'topical',
    );
    expect(links.upsertEdges).toHaveBeenCalledWith([
      expect.objectContaining({
        lane: 'partition',
        scopeKey: 'christopher',
        kind: 'topical',
        score: 0.65,
      }),
    ]);
  });

  it('skips enrichment unless the flag is set', async () => {
    const { service, aiSdkService, memoryRepository } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([]);

    await service.execute(jobData);

    expect(aiSdkService.generateChat).not.toHaveBeenCalled();
  });

  it('runs enrichment when the flag is set', async () => {
    const { service, aiSdkService, memoryRepository, memorySearch } =
      makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'pets', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockResolvedValue([point]);
    memorySearch.searchByText.mockResolvedValue([]);
    memoryRepository.queryNeighbors.mockResolvedValue([]);
    aiSdkService.generateChat.mockResolvedValue({
      text: JSON.stringify({ tags: ['pets', 'dogs'] }),
    });

    await service.execute({ ...jobData, enrich: true });

    expect(aiSdkService.generateChat).toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['p1'], {
      tags: ['pets', 'dogs'],
    });
  });

  it('applies nothing in dryRun mode', async () => {
    const { service, memoryRepository, links } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'PDF', count: 1 },
      { value: 'pdf', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockResolvedValue([]);
    memoryRepository.queryNeighbors.mockResolvedValue([]);

    await service.execute({ ...jobData, dryRun: true });

    expect(memoryRepository.collapseCategory).not.toHaveBeenCalled();
    expect(links.deleteByKind).not.toHaveBeenCalled();
    expect(links.upsertEdges).not.toHaveBeenCalled();
  });

  it('writes inter-category edges when the pair shares a tag', async () => {
    const { service, memoryRepository, links, memorySearch } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'pets', count: 1 },
      { value: 'cars', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockImplementation(
      async (_partition: string, category: string) =>
        category === 'pets'
          ? [
              {
                id: 'p1',
                vector: [1, 0, 0],
                text: 'likes dogs',
                role: 'user' as const,
                tags: ['dogs'],
                createdAt: '2026-01-01',
              },
            ]
          : [],
    );
    memorySearch.searchByText.mockResolvedValue([]);
    // Inter-category neighbor in a different category sharing the 'dogs' tag.
    // The intra query (category='pets') returns nothing; the inter query
    // (category=undefined) returns the cross-category neighbor.
    memoryRepository.queryNeighbors.mockImplementation(
      async (_partition: string, category?: string) =>
        category === 'pets'
          ? []
          : [
              {
                id: 'p2',
                score: 0.5,
                category: 'cars',
                tags: ['dogs'],
              },
            ],
    );

    await service.execute(jobData);

    expect(links.upsertEdges).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ source: 'p1', target: 'p2' }),
      ]),
    );
  });

  it('drops inter-category pairs below the semantic bar without a shared tag', async () => {
    const { service, memoryRepository, links, memorySearch } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([
      { value: 'pets', count: 1 },
      { value: 'cars', count: 1 },
    ]);
    memoryRepository.scrollCategoryPoints.mockImplementation(
      async (_partition: string, category: string) =>
        category === 'pets'
          ? [
              {
                id: 'p1',
                vector: [1, 0, 0],
                text: 'likes dogs',
                role: 'user' as const,
                tags: ['dogs'],
                createdAt: '2026-01-01',
              },
            ]
          : [],
    );
    memorySearch.searchByText.mockResolvedValue([]);
    memoryRepository.queryNeighbors.mockImplementation(
      async (_partition: string, category?: string) =>
        category === 'pets'
          ? []
          : [
              {
                id: 'p2',
                score: 0.5,
                category: 'cars',
                tags: ['unrelated'],
              },
            ],
    );

    await service.execute(jobData);

    expect(links.upsertEdges).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ source: 'p1', target: 'p2' }),
      ]),
    );
  });

  it('auto-triggers the cluster job when enabled', async () => {
    const { service, memoryRepository, memoryEnqueue, overrides } =
      makeService();
    memoryRepository.facetCategories.mockResolvedValue([]);
    overrides.getClusterAutoEnabled.mockReturnValue(true);
    overrides.getClusterModel.mockReturnValue('cluster-model');
    overrides.getClusterMinMembers.mockReturnValue(3);

    await service.execute(jobData);

    expect(memoryEnqueue.enqueueClusterJob).toHaveBeenCalledWith({
      lane: 'partition',
      scopeKey: 'christopher',
      model: 'cluster-model',
      minMembers: 3,
    });
  });

  it('does not auto-trigger the cluster job when disabled', async () => {
    const { service, memoryRepository, memoryEnqueue } = makeService();
    memoryRepository.facetCategories.mockResolvedValue([]);

    await service.execute(jobData);

    expect(memoryEnqueue.enqueueClusterJob).not.toHaveBeenCalled();
  });
});

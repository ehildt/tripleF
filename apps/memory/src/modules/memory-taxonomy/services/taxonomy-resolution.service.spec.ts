import { describe, expect, it, vi } from 'vitest';

import { TaxonomyResolutionService } from './taxonomy-resolution.service.js';

function makeNode(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n1',
    lane: 'partition',
    scopeKey: 'sess-1',
    kind: 'cluster',
    parentId: '',
    name: 'Games',
    normalizedName: 'games',
    summary: null,
    icon: null,
    ...overrides,
  };
}

function makeService() {
  const taxonomy = {
    listNodes: vi.fn().mockResolvedValue([]),
    resolveAlias: vi.fn().mockResolvedValue(undefined),
    insertAlias: vi.fn().mockResolvedValue(undefined),
    getOrCreateNode: vi.fn(),
    setIcon: vi.fn().mockResolvedValue(undefined),
  };
  const taxonomyVectors = {
    upsertLabelPoints: vi.fn().mockResolvedValue(undefined),
  };
  const embeddingService = {
    embed: vi.fn().mockResolvedValue([[0.1, 0.2]]),
  };
  const service = new TaxonomyResolutionService(
    taxonomy as never,
    taxonomyVectors as never,
    embeddingService as never,
  );
  return { service, taxonomy, taxonomyVectors, embeddingService };
}

describe('TaxonomyResolutionService.resolveLabels', () => {
  it('resolves an exact normalized-name hit', async () => {
    const { service, taxonomy } = makeService();
    taxonomy.listNodes.mockResolvedValue([makeNode()]);

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'cluster', label: 'games' },
    ]);

    expect(results).toEqual([
      {
        kind: 'cluster',
        input: 'games',
        name: 'Games',
        nodeId: 'n1',
        how: 'exact',
      },
    ]);
    expect(taxonomy.resolveAlias).not.toHaveBeenCalled();
  });

  it('resolves a permanent alias hit', async () => {
    const { service, taxonomy } = makeService();
    taxonomy.listNodes.mockResolvedValue([makeNode()]);
    taxonomy.resolveAlias.mockResolvedValue('n1');

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'cluster', label: 'gaming' },
    ]);

    expect(results[0]).toMatchObject({ how: 'alias', name: 'Games' });
  });

  it('snaps a fuzzy match and records the alias', async () => {
    const { service, taxonomy } = makeService();
    taxonomy.listNodes.mockResolvedValue([
      makeNode({
        kind: 'tag',
        name: 'Auth Service',
        normalizedName: 'auth-service',
      }),
    ]);

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'tag', label: 'auth-services' },
    ]);

    expect(results[0]).toMatchObject({ how: 'fuzzy', name: 'Auth Service' });
    expect(results[0].score).toBeGreaterThan(0);
    expect(taxonomy.insertAlias).toHaveBeenCalledWith(
      expect.objectContaining({
        nodeId: 'n1',
        alias: 'auth-services',
        source: 'fuzzy',
      }),
    );
  });

  it('uses exact-only minting when reconciling stored canonical labels', async () => {
    const { service, taxonomy } = makeService();
    taxonomy.listNodes.mockResolvedValue([makeNode()]);
    taxonomy.resolveAlias.mockResolvedValue('n1');
    taxonomy.getOrCreateNode.mockResolvedValue(
      makeNode({ id: 'n2', name: 'gaming', normalizedName: 'gaming' }),
    );

    const results = await service.resolveLabels(
      'partition',
      'sess-1',
      [{ kind: 'cluster', label: 'gaming' }],
      { exactOnly: true },
    );

    expect(results[0]).toMatchObject({ how: 'minted', nodeId: 'n2' });
    expect(taxonomy.resolveAlias).not.toHaveBeenCalled();
  });

  it('mints a new node for an unknown label and embeds its vector', async () => {
    const { service, taxonomy, taxonomyVectors, embeddingService } =
      makeService();
    taxonomy.listNodes.mockResolvedValue([]);
    taxonomy.getOrCreateNode.mockResolvedValue(
      makeNode({ id: 'n2', name: 'Cooking', normalizedName: 'cooking' }),
    );

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'cluster', label: 'cooking' },
    ]);

    expect(results[0]).toMatchObject({ how: 'minted', name: 'Cooking' });
    expect(taxonomy.getOrCreateNode).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'cooking', createdBy: 'model' }),
    );
    expect(embeddingService.embed).toHaveBeenCalledWith(
      ['cooking'],
      'document',
    );
    expect(taxonomyVectors.upsertLabelPoints).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'n2', vector: [0.1, 0.2] }),
    ]);
  });

  it('skips the label vector when the embed fails', async () => {
    const { service, taxonomy, taxonomyVectors, embeddingService } =
      makeService();
    taxonomy.listNodes.mockResolvedValue([]);
    taxonomy.getOrCreateNode.mockResolvedValue(
      makeNode({ id: 'n2', name: 'Cooking', normalizedName: 'cooking' }),
    );
    embeddingService.embed.mockRejectedValue(new Error('embed down'));

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'cluster', label: 'cooking' },
    ]);

    expect(results[0].how).toBe('minted');
    expect(taxonomyVectors.upsertLabelPoints).not.toHaveBeenCalled();
  });

  it('narrows fuzzy candidacy to the parent tier', async () => {
    const { service, taxonomy } = makeService();
    taxonomy.listNodes.mockResolvedValue([
      makeNode({
        id: 'c1',
        kind: 'community',
        parentId: 'n-games',
        name: 'Action',
        normalizedName: 'action',
      }),
      makeNode({
        id: 'c2',
        kind: 'community',
        parentId: 'other',
        name: 'Acting',
        normalizedName: 'acting',
      }),
    ]);
    taxonomy.getOrCreateNode.mockResolvedValue(
      makeNode({ id: 'n-games', name: 'Games', normalizedName: 'games' }),
    );

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'cluster', label: 'games' },
      { kind: 'community', label: 'action', parentRef: 'games' },
    ]);

    // The first label mints a cluster node; the second resolves against it
    // as the parent tier.
    expect(results[0]).toMatchObject({ how: 'minted', name: 'Games' });
    expect(results[1]).toMatchObject({ how: 'exact', name: 'Action' });
  });

  it("mints a parent-local node instead of adopting another hub's label", async () => {
    const { service, taxonomy } = makeService();
    taxonomy.listNodes.mockResolvedValue([
      makeNode({ id: 'cluster', kind: 'cluster', parentId: '' }),
      makeNode({
        id: 'community',
        kind: 'community',
        parentId: 'cluster',
        name: 'notes',
        normalizedName: 'notes',
      }),
      makeNode({
        id: 'hub-a',
        kind: 'hub',
        parentId: 'community',
        name: 'alpha',
        normalizedName: 'alpha',
      }),
      makeNode({
        id: 'hub-b',
        kind: 'hub',
        parentId: 'community',
        name: 'beta',
        normalizedName: 'beta',
      }),
      makeNode({
        id: 'node-a',
        kind: 'node',
        parentId: 'hub-a',
        name: 'shared aspect',
        normalizedName: 'shared aspect',
      }),
    ]);
    taxonomy.resolveAlias.mockResolvedValue('node-a');
    taxonomy.getOrCreateNode.mockImplementation(
      async (input: Record<string, unknown>) =>
        makeNode({ ...input, id: 'node-b' }),
    );

    const results = await service.resolveLabels('partition', 'sess-1', [
      { kind: 'cluster', label: 'games' },
      { kind: 'community', label: 'notes', parentRef: 'games' },
      { kind: 'hub', label: 'alpha', parentRef: 'notes' },
      { kind: 'node', label: 'shared aspect', parentRef: 'alpha' },
      { kind: 'hub', label: 'beta', parentRef: 'notes' },
      { kind: 'node', label: 'shared aspect', parentRef: 'beta' },
    ]);

    expect(results[3]).toMatchObject({ how: 'exact', nodeId: 'node-a' });
    expect(results[5]).toMatchObject({ how: 'minted', nodeId: 'node-b' });
    expect(taxonomy.getOrCreateNode).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'node',
        parentId: 'hub-b',
        normalizedName: 'shared aspect',
      }),
    );
  });
});

describe('TaxonomyResolutionService.applyIconHint', () => {
  it('applies a valid icon to the deepest minted node', async () => {
    const { service, taxonomy } = makeService();
    const resolved = [
      {
        kind: 'cluster',
        input: 'games',
        name: 'Games',
        nodeId: 'n1',
        how: 'exact',
      },
      {
        kind: 'hub',
        input: 'stellar',
        name: 'Stellar',
        nodeId: 'n2',
        how: 'minted',
      },
    ] as const;

    await service.applyIconHint('gamepad-2', resolved);

    expect(taxonomy.setIcon).toHaveBeenCalledWith('n2', 'gamepad-2');
  });

  it('ignores invalid icons', async () => {
    const { service, taxonomy } = makeService();
    const resolved = [
      {
        kind: 'hub',
        input: 'stellar',
        name: 'Stellar',
        nodeId: 'n2',
        how: 'minted',
      },
    ] as const;

    await service.applyIconHint('not-a-real-icon', resolved);

    expect(taxonomy.setIcon).not.toHaveBeenCalled();
  });

  it('ignores hints when nothing was minted', async () => {
    const { service, taxonomy } = makeService();
    const resolved = [
      {
        kind: 'cluster',
        input: 'games',
        name: 'Games',
        nodeId: 'n1',
        how: 'exact',
      },
    ] as const;

    await service.applyIconHint('gamepad-2', resolved);

    expect(taxonomy.setIcon).not.toHaveBeenCalled();
  });
});

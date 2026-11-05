import { describe, expect, it, vi } from 'vitest';

import { MemoryTaxonomyRepository } from './memory-taxonomy.repository.js';

function makeRepo() {
  const repo = new MemoryTaxonomyRepository({ url: 'postgres://x' } as never);
  const prisma = {
    memoryTaxonomyNode: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({}),
    },
    memoryTaxonomyAlias: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn().mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') return fn(prisma);
      return fn;
    }),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  (repo as any)._prisma = prisma;
  return { repo, prisma };
}

const nodeRow = {
  id: 'n1',
  lane: 'partition',
  scopeKey: 'sess-1',
  kind: 'cluster',
  parentId: 'root',
  name: 'Games',
  normalizedName: 'games',
  icon: null,
  summary: null,
  createdBy: 'model',
  lastReflectedAt: null,
  lastConsolidatedAt: null,
  lastRelinkedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('MemoryTaxonomyRepository', () => {
  it('lists nodes of a scope ordered by kind and name', async () => {
    const { repo, prisma } = makeRepo();
    prisma.memoryTaxonomyNode.findMany.mockResolvedValue([nodeRow]);

    const nodes = await repo.listNodes('partition', 'sess-1');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: 'n1', name: 'Games' });
    expect(prisma.memoryTaxonomyNode.findMany).toHaveBeenCalledWith({
      where: { lane: 'partition', scopeKey: 'sess-1' },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
  });

  it('lists aliases of a scope', async () => {
    const { repo, prisma } = makeRepo();
    prisma.memoryTaxonomyAlias.findMany.mockResolvedValue([
      {
        nodeId: 'n1',
        alias: 'gaming',
        source: 'fuzzy',
        score: 0.8,
        createdAt: new Date(),
      },
    ]);

    const aliases = await repo.listAliases('partition', 'sess-1');

    expect(aliases).toHaveLength(1);
    expect(prisma.memoryTaxonomyAlias.findMany).toHaveBeenCalledWith({
      where: { lane: 'partition', scopeKey: 'sess-1' },
      orderBy: { createdAt: 'asc' },
      select: {
        nodeId: true,
        alias: true,
        source: true,
        score: true,
        createdAt: true,
      },
    });
  });

  it('finds a node by id', async () => {
    const { repo, prisma } = makeRepo();
    prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(nodeRow);

    const node = await repo.findNode('n1');

    expect(node).toMatchObject({ id: 'n1' });
  });

  it('returns undefined when a node is gone', async () => {
    const { repo } = makeRepo();

    const node = await repo.findNode('n1');

    expect(node).toBeUndefined();
  });

  it('creates a node on a miss', async () => {
    const { repo, prisma } = makeRepo();
    prisma.memoryTaxonomyNode.create.mockResolvedValue(nodeRow);

    const node = await repo.getOrCreateNode({
      lane: 'partition',
      scopeKey: 'sess-1',
      kind: 'cluster',
      parentId: 'root',
      name: 'Games',
      normalizedName: 'games',
      createdBy: 'model',
    });

    expect(node).toMatchObject({ id: 'n1' });
    expect(prisma.memoryTaxonomyNode.create).toHaveBeenCalled();
  });

  it('re-reads the node on a racing create (P2002)', async () => {
    const { repo, prisma } = makeRepo();
    const { Prisma } = await import('../../../generated/prisma/client.js');
    prisma.memoryTaxonomyNode.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    prisma.memoryTaxonomyNode.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(nodeRow);

    const node = await repo.getOrCreateNode({
      lane: 'partition',
      scopeKey: 'sess-1',
      kind: 'cluster',
      parentId: 'root',
      name: 'Games',
      normalizedName: 'games',
      createdBy: 'model',
    });

    expect(node).toMatchObject({ id: 'n1' });
  });

  it('resolves an alias to its node id', async () => {
    const { repo, prisma } = makeRepo();
    prisma.memoryTaxonomyAlias.findUnique.mockResolvedValue({ nodeId: 'n1' });

    const nodeId = await repo.resolveAlias(
      'partition',
      'sess-1',
      'cluster',
      'gaming',
    );

    expect(nodeId).toBe('n1');
  });

  it('inserts an alias', async () => {
    const { repo, prisma } = makeRepo();

    await repo.insertAlias({
      nodeId: 'n1',
      lane: 'partition',
      scopeKey: 'sess-1',
      kind: 'cluster',
      alias: 'gaming',
      source: 'fuzzy',
      score: 0.8,
    });

    expect(prisma.memoryTaxonomyAlias.create).toHaveBeenCalledWith({
      data: {
        nodeId: 'n1',
        lane: 'partition',
        scopeKey: 'sess-1',
        kind: 'cluster',
        alias: 'gaming',
        source: 'fuzzy',
        score: 0.8,
      },
    });
  });

  it('tolerates a racing alias insert', async () => {
    const { repo, prisma } = makeRepo();
    const { Prisma } = await import('../../../generated/prisma/client.js');
    prisma.memoryTaxonomyAlias.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );

    await expect(
      repo.insertAlias({
        nodeId: 'n1',
        lane: 'partition',
        scopeKey: 'sess-1',
        kind: 'cluster',
        alias: 'gaming',
        source: 'fuzzy',
      }),
    ).resolves.toBeUndefined();
  });

  it('renames a node and records the old name as a user alias', async () => {
    const { repo, prisma } = makeRepo();
    prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(nodeRow);
    prisma.memoryTaxonomyNode.update.mockResolvedValue({
      ...nodeRow,
      name: 'Video Games',
      normalizedName: 'video-games',
    });

    const node = await repo.renameNode('n1', 'Video Games', 'video-games');

    expect(node).toMatchObject({ name: 'Video Games' });
    expect(prisma.memoryTaxonomyAlias.createMany).toHaveBeenCalledWith({
      data: [
        {
          nodeId: 'n1',
          lane: 'partition',
          scopeKey: 'sess-1',
          kind: 'cluster',
          alias: 'games',
          source: 'user',
        },
      ],
      skipDuplicates: true,
    });
  });

  it('returns undefined when renaming a missing node', async () => {
    const { repo } = makeRepo();

    const node = await repo.renameNode('n1', 'X', 'x');

    expect(node).toBeUndefined();
  });

  it('sets a node icon', async () => {
    const { repo, prisma } = makeRepo();

    await repo.setIcon('n1', 'gamepad-2');

    expect(prisma.memoryTaxonomyNode.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { icon: 'gamepad-2' },
    });
  });

  it('stamps a maintenance field on listed nodes', async () => {
    const { repo, prisma } = makeRepo();
    const at = new Date('2026-01-01');

    await repo.touchMaintenance(['n1', 'n2'], 'lastReflectedAt', at);

    expect(prisma.memoryTaxonomyNode.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['n1', 'n2'] } },
      data: { lastReflectedAt: at },
    });
  });

  it('stamps a maintenance field by label list grouped by kind', async () => {
    const { repo, prisma } = makeRepo();
    const at = new Date('2026-01-01');

    await repo.touchMaintenanceForLabels(
      'partition',
      'sess-1',
      [
        { kind: 'cluster', normalizedName: 'games' },
        { kind: 'cluster', normalizedName: 'cooking' },
        { kind: 'hub', normalizedName: 'stellar' },
      ],
      'lastReflectedAt',
      at,
    );

    expect(prisma.memoryTaxonomyNode.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.memoryTaxonomyNode.updateMany).toHaveBeenCalledWith({
      where: {
        lane: 'partition',
        scopeKey: 'sess-1',
        kind: 'cluster',
        normalizedName: { in: ['games', 'cooking'] },
      },
      data: { lastReflectedAt: at },
    });
  });

  describe('lifecycle', () => {
    it('disconnects the client and drops it on destroy', async () => {
      const { repo, prisma } = makeRepo();

      await repo.onModuleDestroy();

      expect(prisma.$disconnect).toHaveBeenCalled();
      expect((repo as any)._prisma).toBeNull();
    });

    it('tolerates destroy before the client was connected', async () => {
      const repo = new MemoryTaxonomyRepository({
        url: 'postgres://x',
      } as never);

      await expect(repo.onModuleDestroy()).resolves.toBeUndefined();
    });
  });

  describe('mergeNodes', () => {
    it('does nothing when the source node is gone', async () => {
      const { repo, prisma } = makeRepo();
      prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(null);

      await repo.mergeNodes('gone', 'target');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('moves aliases, records the killed name and deletes the source', async () => {
      const { repo, prisma } = makeRepo();
      prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(nodeRow);

      await repo.mergeNodes('n1', 'n2', { source: 'llm', score: 0.92 });

      expect(prisma.memoryTaxonomyAlias.updateMany).toHaveBeenCalledWith({
        where: { nodeId: 'n1' },
        data: { nodeId: 'n2' },
      });
      expect(prisma.memoryTaxonomyAlias.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            nodeId: 'n2',
            alias: 'games',
            source: 'llm',
            score: 0.92,
          }),
        ],
        skipDuplicates: true,
      });
      expect(prisma.memoryTaxonomyNode.delete).toHaveBeenCalledWith({
        where: { id: 'n1' },
      });
    });

    it('defaults the provenance source to the user', async () => {
      const { repo, prisma } = makeRepo();
      prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(nodeRow);

      await repo.mergeNodes('n1', 'n2');

      expect(prisma.memoryTaxonomyAlias.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ source: 'user' })],
        skipDuplicates: true,
      });
    });

    it('re-parents non-colliding children to the target', async () => {
      const { repo, prisma } = makeRepo();
      prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(nodeRow);
      prisma.memoryTaxonomyNode.findMany
        .mockResolvedValueOnce([
          {
            ...nodeRow,
            id: 'child-1',
            parentId: 'n1',
            normalizedName: 'shooters',
          },
        ])
        .mockResolvedValueOnce([]);

      await repo.mergeNodes('n1', 'n2');

      expect(prisma.memoryTaxonomyNode.update).toHaveBeenCalledWith({
        where: { id: 'child-1' },
        data: { parentId: 'n2' },
      });
      expect(prisma.memoryTaxonomyNode.delete).toHaveBeenCalledTimes(1);
    });

    it('collapses a name-colliding child into its target counterpart', async () => {
      const { repo, prisma } = makeRepo();
      prisma.memoryTaxonomyNode.findUnique.mockResolvedValue(nodeRow);
      const collidingChild = {
        ...nodeRow,
        id: 'child-src',
        parentId: 'n1',
        normalizedName: 'shooters',
      };
      const targetChild = {
        ...nodeRow,
        id: 'child-target',
        parentId: 'n2',
        normalizedName: 'shooters',
      };
      prisma.memoryTaxonomyNode.findMany
        // source children
        .mockResolvedValueOnce([collidingChild])
        // target children
        .mockResolvedValueOnce([targetChild])
        // grand-children of the collapsing child: none
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await repo.mergeNodes('n1', 'n2');

      expect(prisma.memoryTaxonomyAlias.updateMany).toHaveBeenCalledWith({
        where: { nodeId: 'child-src' },
        data: { nodeId: 'child-target' },
      });
      expect(prisma.memoryTaxonomyNode.delete).toHaveBeenCalledWith({
        where: { id: 'child-src' },
      });
    });
  });

  describe('touchMaintenance', () => {
    it('writes nothing for an empty id list', async () => {
      const { repo, prisma } = makeRepo();

      await repo.touchMaintenance([], 'lastReflectedAt', new Date());

      expect(prisma.memoryTaxonomyNode.updateMany).not.toHaveBeenCalled();
    });
  });
});

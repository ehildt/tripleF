import { describe, expect, it, vi } from 'vitest';

import { MemoryLinkRepository } from './memory-link.repository.js';
import type { MemoryLinkKind } from './memory-link.repository.types.js';

function makeRepo(prisma: unknown): MemoryLinkRepository {
  const repo = new MemoryLinkRepository({ url: 'postgres://x' } as never);
  (repo as unknown as { _prisma: unknown })._prisma = prisma;
  return repo;
}

describe('MemoryLinkRepository', () => {
  it('maps rows to edges with the kind cast', async () => {
    const repo = makeRepo({
      memoryLink: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { source: 'a', target: 'b', score: 0.9, kind: 'semantic' },
          ]),
      },
    });

    const edges = await repo.listEdges('partition', 'c', 's', 10);

    expect(edges).toEqual([
      { source: 'a', target: 'b', score: 0.9, kind: 'semantic' },
    ]);
  });

  it('deletes edges by kind', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const repo = makeRepo({ memoryLink: { deleteMany } });

    await repo.deleteByKind('partition', 'c', 's', 'topical' as MemoryLinkKind);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        lane: 'partition',
        collection: 'c',
        scopeKey: 's',
        kind: 'topical',
      },
    });
  });

  it('inserts edges skipping exact duplicates', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const repo = makeRepo({ memoryLink: { createMany } });
    const rows = [
      {
        lane: 'partition' as const,
        collection: 'c',
        scopeKey: 's',
        source: 'a',
        target: 'b',
        score: 0.9,
        kind: 'semantic' as const,
      },
    ];

    await repo.upsertEdges(rows);

    expect(createMany).toHaveBeenCalledWith({
      data: rows,
      skipDuplicates: true,
    });
  });

  it('skips an empty edge batch', async () => {
    const createMany = vi.fn();
    const repo = makeRepo({ memoryLink: { createMany } });

    await repo.upsertEdges([]);

    expect(createMany).not.toHaveBeenCalled();
  });

  it('lists all edges uncapped', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([
        { source: 'a', target: 'b', score: 0.9, kind: 'semantic' },
      ]);
    const repo = makeRepo({ memoryLink: { findMany } });

    const edges = await repo.listAllEdges('partition', 'c', 's');

    expect(edges).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { lane: 'partition', collection: 'c', scopeKey: 's' },
      orderBy: { score: 'desc' },
    });
  });

  it('counts edges of a scope', async () => {
    const count = vi.fn().mockResolvedValue(4);
    const repo = makeRepo({ memoryLink: { count } });

    const total = await repo.countForScope('partition', 'c', 's');

    expect(total).toBe(4);
  });

  it('deletes edges touching any of the given point ids', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const repo = makeRepo({ memoryLink: { deleteMany } });

    await repo.deleteByPointIds(['p1', 'p2']);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { source: { in: ['p1', 'p2'] } },
          { target: { in: ['p1', 'p2'] } },
        ],
      },
    });
  });

  it('skips deleting by point ids when the list is empty', async () => {
    const deleteMany = vi.fn();
    const repo = makeRepo({ memoryLink: { deleteMany } });

    await repo.deleteByPointIds([]);

    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('deletes every edge of a scope', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 3 });
    const repo = makeRepo({ memoryLink: { deleteMany } });

    await repo.deleteByScope('partition', 'c', 's');

    expect(deleteMany).toHaveBeenCalledWith({
      where: { lane: 'partition', collection: 'c', scopeKey: 's' },
    });
  });
});

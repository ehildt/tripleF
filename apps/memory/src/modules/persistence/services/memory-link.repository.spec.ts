import { describe, expect, it, vi } from 'vitest';

import {
  type MemoryLinkKind,
  MemoryLinkRepository,
} from './memory-link.repository.js';

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
});

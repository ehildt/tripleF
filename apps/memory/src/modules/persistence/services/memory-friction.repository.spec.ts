import { describe, expect, it, vi } from 'vitest';

import { MemoryFrictionRepository } from './memory-friction.repository.js';

function makeRepo(prisma: unknown): MemoryFrictionRepository {
  const repo = new MemoryFrictionRepository({ url: 'postgres://x' } as never);
  (repo as unknown as { _prisma: unknown })._prisma = prisma;
  return repo;
}

describe('MemoryFrictionRepository', () => {
  it('upserts frictions with skipDuplicates and no-ops on empty', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const repo = makeRepo({ memoryFriction: { createMany } });

    await repo.upsertFrictions([
      {
        lane: 'partition',
        collection: 'c',
        scopeKey: 's',
        source: 'a',
        target: 'b',
        kind: 'contradiction',
      },
    ]);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          lane: 'partition',
          collection: 'c',
          scopeKey: 's',
          source: 'a',
          target: 'b',
          kind: 'contradiction',
        },
      ],
      skipDuplicates: true,
    });

    await repo.upsertFrictions([]);
    expect(createMany).toHaveBeenCalledTimes(1);
  });

  it('lists frictions of one scope mapped to edges', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        source: 'a',
        target: 'b',
        kind: 'contradiction',
        status: 'open',
        reason: 'r',
        resolution: null,
      },
    ]);
    const repo = makeRepo({ memoryFriction: { findMany } });

    const edges = await repo.listFrictions('partition', 'c', 's', 10);

    expect(findMany).toHaveBeenCalledWith({
      where: { lane: 'partition', collection: 'c', scopeKey: 's' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    expect(edges).toEqual([
      {
        source: 'a',
        target: 'b',
        kind: 'contradiction',
        status: 'open',
        reason: 'r',
        resolution: undefined,
      },
    ]);
  });

  it('resolves a friction by id', async () => {
    const update = vi.fn().mockResolvedValue({});
    const repo = makeRepo({ memoryFriction: { update } });

    await repo.resolveFriction('f1', 'later wins');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'f1' },
      data: {
        status: 'resolved',
        resolution: 'later wins',
        resolvedAt: expect.any(Date),
      },
    });
  });

  it('resolves a friction by its unique pair key', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const repo = makeRepo({ memoryFriction: { updateMany } });

    await repo.resolveFrictionByPair(
      'partition',
      'c',
      's',
      'a',
      'b',
      'later wins',
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        lane: 'partition',
        collection: 'c',
        scopeKey: 's',
        source: 'a',
        target: 'b',
      },
      data: {
        status: 'resolved',
        resolution: 'later wins',
        resolvedAt: expect.any(Date),
      },
    });
  });

  it('counts open frictions touching a point on either side', async () => {
    const count = vi.fn().mockResolvedValue(2);
    const repo = makeRepo({ memoryFriction: { count } });

    await expect(repo.countOpenForPoint('p1')).resolves.toBe(2);

    expect(count).toHaveBeenCalledWith({
      where: {
        status: 'open',
        OR: [{ source: 'p1' }, { target: 'p1' }],
      },
    });
  });

  it('deletes frictions touching any of the given point ids', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const repo = makeRepo({ memoryFriction: { deleteMany } });

    await repo.deleteByPointIds(['a', 'b']);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ source: { in: ['a', 'b'] } }, { target: { in: ['a', 'b'] } }],
      },
    });

    await repo.deleteByPointIds([]);
    expect(deleteMany).toHaveBeenCalledTimes(1);
  });

  it('deletes every friction of one scope', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const repo = makeRepo({ memoryFriction: { deleteMany } });

    await repo.deleteByScope('encyclopedia', 'c', 'global');

    expect(deleteMany).toHaveBeenCalledWith({
      where: { lane: 'encyclopedia', collection: 'c', scopeKey: 'global' },
    });
  });
});

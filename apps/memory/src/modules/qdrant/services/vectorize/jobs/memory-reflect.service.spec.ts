import { describe, expect, it, vi } from 'vitest';

import { MemoryReflectService } from './memory-reflect.service.js';

function makeService() {
  const adjudicator = { adjudicate: vi.fn() };
  const frictions = {
    upsertFrictions: vi.fn(),
    resolveFrictionByPair: vi.fn(),
    countOpenForPoint: vi.fn(),
  };
  const memoryRepository = {
    collection: 'harness_memory_nomic',
    scrollUnreflected: vi.fn(),
    queryNeighborFacts: vi.fn(),
    setPayloadForPoints: vi.fn(),
  };
  const encyclopediaRepository = {
    collection: 'memory_encyclopedia_nomic',
    scrollUnreflected: vi.fn(),
    queryNeighborFacts: vi.fn(),
    setPayloadForPoints: vi.fn(),
  };
  const memoryEnqueue = { enqueueConvictionJob: vi.fn() };
  const overrides = {
    getConvictionAutoEnabled: vi.fn(),
    getConvictionModel: vi.fn(),
    getConvictionBatchLimit: vi.fn(),
    getConvictionMaxPerCluster: vi.fn(),
  };
  const service = new MemoryReflectService(
    adjudicator as never,
    frictions as never,
    memoryRepository as never,
    encyclopediaRepository as never,
    memoryEnqueue as never,
    overrides as never,
  );
  return {
    service,
    adjudicator,
    frictions,
    memoryRepository,
    encyclopediaRepository,
    memoryEnqueue,
    overrides,
  };
}

const partitionJob = {
  lane: 'partition' as const,
  scopeKey: 'christopher',
  model: 'qwen3.8:27b',
};

const point = {
  id: 'p1',
  vector: [1, 0, 0],
  text: 'User likes dogs',
  role: 'user' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const candidate = {
  id: 'p2',
  text: 'User dislikes dogs',
  role: 'user' as const,
  createdAt: '2026-01-02T00:00:00.000Z',
};

describe('MemoryReflectService', () => {
  it('screens unreflected points and marks them reflected', async () => {
    const { service, adjudicator, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([]);
    adjudicator.adjudicate.mockResolvedValue({ contradicts: false });

    await service.execute(partitionJob);

    expect(memoryRepository.scrollUnreflected).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      limit: 100,
    });
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['p1'], {
      is_reflected: true,
    });
  });

  it('filters cognition reflection to insight and conviction records', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([]);

    await service.execute({
      lane: 'cognition',
      scopeKey: 'christopher',
      model: 'm',
    });

    expect(memoryRepository.scrollUnreflected).toHaveBeenCalledWith({
      memoryCognition: 'christopher',
      tags: ['insight', 'conviction'],
      limit: 100,
    });
  });

  it('supersedes the loser and resolves the friction when a winner is named', async () => {
    const { service, adjudicator, frictions, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([candidate]);
    adjudicator.adjudicate.mockResolvedValue({
      contradicts: true,
      conflictingId: 'p2',
      winnerId: 'p2',
      reason: 'later wins',
    });
    frictions.countOpenForPoint.mockResolvedValue(0);

    await service.execute(partitionJob);

    expect(frictions.upsertFrictions).toHaveBeenCalledWith([
      {
        lane: 'partition',
        collection: 'harness_memory_nomic',
        scopeKey: 'christopher',
        source: 'p1',
        target: 'p2',
        kind: 'contradiction',
        status: 'open',
        reason: 'later wins',
      },
    ]);
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['p1', 'p2'],
      { is_friction: true },
    );
    // The loser is the record (winner is the candidate p2).
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['p1'], {
      superseded: true,
      superseded_by: 'p2',
      is_friction: false,
    });
    expect(frictions.resolveFrictionByPair).toHaveBeenCalledWith(
      'partition',
      'harness_memory_nomic',
      'christopher',
      'p1',
      'p2',
      'later wins',
    );
    // The winner's flag clears only when no other open friction remains.
    expect(frictions.countOpenForPoint).toHaveBeenCalledWith('p2');
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['p2'], {
      is_friction: false,
    });
    // The screened point is still marked reflected.
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(['p1'], {
      is_reflected: true,
    });
  });

  it('keeps the winner flagged when another open friction still involves it', async () => {
    const { service, adjudicator, frictions, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([candidate]);
    adjudicator.adjudicate.mockResolvedValue({
      contradicts: true,
      conflictingId: 'p2',
      winnerId: 'p2',
      reason: 'later wins',
    });
    frictions.countOpenForPoint.mockResolvedValue(1);

    await service.execute(partitionJob);

    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalledWith(
      ['p2'],
      { is_friction: false },
    );
  });

  it('leaves the friction open when no winner is named', async () => {
    const { service, adjudicator, frictions, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([candidate]);
    adjudicator.adjudicate.mockResolvedValue({
      contradicts: true,
      conflictingId: 'p2',
      reason: 'unclear',
    });

    await service.execute(partitionJob);

    expect(frictions.upsertFrictions).toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['p1', 'p2'],
      { is_friction: true },
    );
    expect(frictions.resolveFrictionByPair).not.toHaveBeenCalled();
    expect(frictions.countOpenForPoint).not.toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalledWith(
      ['p1'],
      expect.objectContaining({ superseded: true }),
    );
  });

  it('defers a point whose verdict is unparseable', async () => {
    const { service, adjudicator, frictions, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([]);
    adjudicator.adjudicate.mockResolvedValue(undefined);

    await service.execute(partitionJob);

    expect(frictions.upsertFrictions).not.toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalled();
  });

  it('skips a point superseded earlier in the same run', async () => {
    const { service, adjudicator, frictions, memoryRepository } = makeService();
    const p2 = {
      id: 'p2',
      vector: [0, 1, 0],
      text: 'User dislikes dogs',
      role: 'user' as const,
      createdAt: '2026-01-02T00:00:00.000Z',
    };
    memoryRepository.scrollUnreflected.mockResolvedValue([point, p2]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([candidate]);
    adjudicator.adjudicate.mockResolvedValue({
      contradicts: true,
      conflictingId: 'p2',
      winnerId: 'p1',
      reason: 'earlier wins',
    });
    frictions.countOpenForPoint.mockResolvedValue(0);

    await service.execute(partitionJob);

    // p1 screens p2 and supersedes it; p2 is then skipped in the same run.
    expect(adjudicator.adjudicate).toHaveBeenCalledTimes(1);
  });

  it('applies nothing in dryRun mode', async () => {
    const { service, adjudicator, frictions, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([candidate]);
    adjudicator.adjudicate.mockResolvedValue({
      contradicts: true,
      conflictingId: 'p2',
      winnerId: 'p2',
      reason: 'later wins',
    });

    await service.execute({ ...partitionJob, dryRun: true });

    expect(frictions.upsertFrictions).not.toHaveBeenCalled();
    expect(frictions.resolveFrictionByPair).not.toHaveBeenCalled();
    expect(memoryRepository.setPayloadForPoints).not.toHaveBeenCalled();
  });

  it('reflects encyclopedia chunks through the encyclopedia repository', async () => {
    const { service, adjudicator, encyclopediaRepository, memoryRepository } =
      makeService();
    const chunk = {
      id: 'c1',
      vector: [1, 0, 0],
      content: 'Stellar Blade released 2024',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    };
    encyclopediaRepository.scrollUnreflected.mockResolvedValue([chunk]);
    encyclopediaRepository.queryNeighborFacts.mockResolvedValue([]);
    adjudicator.adjudicate.mockResolvedValue({ contradicts: false });

    await service.execute({
      lane: 'encyclopedia',
      scopeKey: 'global',
      model: 'm',
    });

    expect(encyclopediaRepository.scrollUnreflected).toHaveBeenCalledWith(100);
    expect(encyclopediaRepository.setPayloadForPoints).toHaveBeenCalledWith(
      ['c1'],
      { is_reflected: true },
    );
    expect(memoryRepository.scrollUnreflected).not.toHaveBeenCalled();
  });

  it('caps the per-run limit at 500', async () => {
    const { service, memoryRepository } = makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([]);

    await service.execute({ ...partitionJob, limit: 10000 });

    expect(memoryRepository.scrollUnreflected).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      limit: 500,
    });
  });

  it('auto-triggers conviction synthesis after a partition reflect when enabled', async () => {
    const { service, adjudicator, memoryRepository, memoryEnqueue, overrides } =
      makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([]);
    adjudicator.adjudicate.mockResolvedValue({ contradicts: false });
    overrides.getConvictionAutoEnabled.mockReturnValue(true);
    overrides.getConvictionModel.mockReturnValue(undefined);
    overrides.getConvictionBatchLimit.mockReturnValue(100);
    overrides.getConvictionMaxPerCluster.mockReturnValue(5);

    await service.execute(partitionJob);

    expect(memoryEnqueue.enqueueConvictionJob).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      // Falls back to the reflection model when no conviction model is set.
      model: 'qwen3.8:27b',
      limit: 100,
      maxConvictionsPerCluster: 5,
    });
  });

  it('skips the conviction auto-trigger when disabled', async () => {
    const { service, adjudicator, memoryRepository, memoryEnqueue, overrides } =
      makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([]);
    adjudicator.adjudicate.mockResolvedValue({ contradicts: false });
    overrides.getConvictionAutoEnabled.mockReturnValue(false);

    await service.execute(partitionJob);

    expect(memoryEnqueue.enqueueConvictionJob).not.toHaveBeenCalled();
  });

  it('never auto-triggers conviction synthesis for non-partition lanes', async () => {
    const { service, adjudicator, memoryRepository, memoryEnqueue, overrides } =
      makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([point]);
    memoryRepository.queryNeighborFacts.mockResolvedValue([]);
    adjudicator.adjudicate.mockResolvedValue({ contradicts: false });
    overrides.getConvictionAutoEnabled.mockReturnValue(true);

    await service.execute({
      lane: 'cognition',
      scopeKey: 'christopher',
      model: 'm',
    });

    expect(memoryEnqueue.enqueueConvictionJob).not.toHaveBeenCalled();
  });

  it('does not auto-trigger conviction synthesis when reflect screened nothing', async () => {
    const { service, memoryRepository, memoryEnqueue, overrides } =
      makeService();
    memoryRepository.scrollUnreflected.mockResolvedValue([]);
    overrides.getConvictionAutoEnabled.mockReturnValue(true);

    await service.execute(partitionJob);

    expect(memoryEnqueue.enqueueConvictionJob).not.toHaveBeenCalled();
  });
});

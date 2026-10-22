import type { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { MemoryEnqueueService } from './memory-enqueue.service.js';

const config = (enabled: boolean): QdrantConfig =>
  ({ enabled }) as QdrantConfig;

function makeService(enabled: boolean) {
  const addBulk = vi.fn().mockResolvedValue(undefined);
  const add = vi.fn().mockResolvedValue({ id: 'job-42' });
  const queue = { add, addBulk } as unknown as Queue;
  return {
    service: new MemoryEnqueueService(queue, config(enabled)),
    add,
    addBulk,
  };
}

describe('MemoryEnqueueService job enqueues', () => {
  it('enqueues a profile job', async () => {
    const { service, add } = makeService(true);
    await service.enqueueProfileJob({
      memoryCognition: 'cog-1',
      requestId: 'req-1',
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith('memory-profile', expect.any(Object));
  });

  it('enqueues a consolidate job with a dedupe jobId', async () => {
    const { service, add } = makeService(true);
    await service.enqueueConsolidateJob({
      memoryPartition: 'sess-1',
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith('memory-consolidate', expect.any(Object), {
      jobId: 'consolidate-sess-1-apply',
    });
  });

  it('skips a consolidate job without a model', async () => {
    const { service, add } = makeService(true);
    await service.enqueueConsolidateJob({
      memoryPartition: 'sess-1',
    } as never);
    expect(add).not.toHaveBeenCalled();
  });

  it('enqueues a relink job with a dry-run jobId', async () => {
    const { service, add } = makeService(true);
    await service.enqueueRelinkJob({
      memoryPartition: 'sess-1',
      model: 'm',
      dryRun: true,
    } as never);
    expect(add).toHaveBeenCalledWith('memory-relink', expect.any(Object), {
      jobId: 'relink-sess-1-dry',
    });
  });

  it('enqueues a taxonomy reconcile job', async () => {
    const { service, add } = makeService(true);
    await service.enqueueTaxonomyReconcileJob({
      lane: 'partition',
      scopeKey: 'sess-1',
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith(
      'memory-taxonomy-reconcile',
      expect.any(Object),
      { jobId: 'taxonomy-reconcile-partition-sess-1-apply' },
    );
  });

  it('enqueues an encyclopedia sweep with a singleton jobId', async () => {
    const { service, add } = makeService(true);
    await service.enqueueEncyclopediaSweep({} as never);
    expect(add).toHaveBeenCalledWith(
      'encyclopedia-consolidate',
      expect.any(Object),
      { jobId: 'encyclopedia-consolidate-apply' },
    );
  });

  it('enqueues an encyclopedia classify job', async () => {
    const { service, add } = makeService(true);
    await service.enqueueEncyclopediaClassify({ model: 'm' } as never);
    expect(add).toHaveBeenCalledWith(
      'encyclopedia-classify',
      expect.any(Object),
      { jobId: 'encyclopedia-classify-apply' },
    );
  });

  it('skips an encyclopedia classify job without a model', async () => {
    const { service, add } = makeService(true);
    await service.enqueueEncyclopediaClassify({} as never);
    expect(add).not.toHaveBeenCalled();
  });

  it('enqueues a reflect job', async () => {
    const { service, add } = makeService(true);
    await service.enqueueReflectJob({
      lane: 'partition',
      scopeKey: 'sess-1',
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith('memory-reflect', expect.any(Object), {
      jobId: 'reflect-partition-sess-1-apply',
    });
  });

  it('enqueues a conviction job', async () => {
    const { service, add } = makeService(true);
    await service.enqueueConvictionJob({
      memoryPartition: 'sess-1',
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith('memory-conviction', expect.any(Object), {
      jobId: 'conviction-sess-1-apply',
    });
  });

  it('enqueues a cluster job', async () => {
    const { service, add } = makeService(true);
    await service.enqueueClusterJob({
      lane: 'partition',
      scopeKey: 'sess-1',
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith('memory-cluster', expect.any(Object), {
      jobId: 'cluster-partition-sess-1-apply',
    });
  });

  it('enqueues a research job with a chain-scoped jobId', async () => {
    const { service, add } = makeService(true);
    await service.enqueueResearchJob({
      chainId: 'chain-1',
      depth: 2,
      model: 'm',
    } as never);
    expect(add).toHaveBeenCalledWith(
      'encyclopedia-research',
      expect.any(Object),
      { jobId: 'research-chain-1-2' },
    );
  });

  it('enqueues a root research job with a singleton jobId', async () => {
    const { service, add } = makeService(true);
    await service.enqueueResearchJob({ model: 'm' } as never);
    expect(add).toHaveBeenCalledWith(
      'encyclopedia-research',
      expect.any(Object),
      { jobId: 'research-root-apply' },
    );
  });

  it('does nothing for every enqueue when the feature is disabled', async () => {
    const { service, add } = makeService(false);
    await service.enqueueProfileJob({ requestId: 'r', model: 'm' } as never);
    await service.enqueueConsolidateJob({
      memoryPartition: 's',
      model: 'm',
    } as never);
    await service.enqueueClusterJob({
      lane: 'partition',
      scopeKey: 's',
      model: 'm',
    } as never);
    expect(add).not.toHaveBeenCalled();
  });

  it('swallows queue errors for every enqueue', async () => {
    const { service, add } = makeService(true);
    add.mockRejectedValue(new Error('redis down'));
    await expect(
      service.enqueueProfileJob({ requestId: 'r', model: 'm' } as never),
    ).resolves.toBeUndefined();
    await expect(
      service.enqueueConsolidateJob({
        memoryPartition: 's',
        model: 'm',
      } as never),
    ).resolves.toBeUndefined();
  });
});

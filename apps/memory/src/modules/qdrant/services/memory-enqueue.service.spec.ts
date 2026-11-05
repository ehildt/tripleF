import type { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import {
  ENCYCLOPEDIA_CLASSIFY_JOB,
  ENCYCLOPEDIA_CONSOLIDATE_JOB,
  ENCYCLOPEDIA_RESEARCH_JOB,
  MEMORY_CLUSTER_JOB,
  MEMORY_CONSOLIDATE_JOB,
  MEMORY_CONVICTION_JOB,
  MEMORY_PROFILE_JOB,
  MEMORY_REFLECT_JOB,
  MEMORY_RELINK_JOB,
  MEMORY_TAXONOMY_RECONCILE_JOB,
} from '../constants/qdrant.constants.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { MemoryEnqueueService } from './memory-enqueue.service.js';

const buildService = (enabled = true) => {
  const queue = {
    add: vi.fn().mockResolvedValue({ id: '1' }),
  } as unknown as Queue;
  const service = new MemoryEnqueueService(queue, { enabled } as QdrantConfig);

  return { service, queue };
};

describe('MemoryEnqueueService', () => {
  describe('when memory is disabled', () => {
    it('enqueues nothing', async () => {
      const { service, queue } = buildService(false);

      await service.enqueueProfileJob({ requestId: 'r1' } as never);
      await service.enqueueConsolidateJob({
        memoryPartition: 'p',
        model: 'm',
      } as never);
      await service.enqueueRelinkJob({
        memoryPartition: 'p',
        model: 'm',
      } as never);
      await service.enqueueTaxonomyReconcileJob({
        lane: 'partition',
        scopeKey: 's',
        model: 'm',
      } as never);
      await service.enqueueEncyclopediaSweep({} as never);
      await service.enqueueEncyclopediaClassify({ model: 'm' } as never);
      await service.enqueueReflectJob({
        lane: 'partition',
        scopeKey: 's',
        model: 'm',
      } as never);
      await service.enqueueConvictionJob({
        memoryPartition: 'p',
        model: 'm',
      } as never);
      await service.enqueueClusterJob({
        lane: 'partition',
        scopeKey: 's',
        model: 'm',
      } as never);
      await service.enqueueResearchJob({ model: 'm' } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('profile job', () => {
    it('enqueues after an answered turn', async () => {
      const { service, queue } = buildService();

      await service.enqueueProfileJob({ requestId: 'r1' } as never);

      expect(queue.add).toHaveBeenCalledWith(MEMORY_PROFILE_JOB, {
        requestId: 'r1',
      });
    });

    it('swallows a queue failure', async () => {
      const { service, queue } = buildService();
      vi.mocked(queue.add).mockRejectedValueOnce(new Error('redis down'));

      await expect(
        service.enqueueProfileJob({ requestId: 'r1' } as never),
      ).resolves.toBeUndefined();
    });
  });

  describe('maintenance jobs', () => {
    it('dedupes the consolidate job per partition and mode', async () => {
      const { service, queue } = buildService();

      await service.enqueueConsolidateJob({
        memoryPartition: 'p',
        model: 'm',
        dryRun: true,
      } as never);
      await service.enqueueConsolidateJob({
        memoryPartition: 'p',
        model: 'm',
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_CONSOLIDATE_JOB,
        expect.anything(),
        { jobId: 'consolidate-p-dry' },
      );
      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_CONSOLIDATE_JOB,
        expect.anything(),
        { jobId: 'consolidate-p-apply' },
      );
    });

    it('dedupes the relink job per partition and mode', async () => {
      const { service, queue } = buildService();

      await service.enqueueRelinkJob({
        memoryPartition: 'p',
        model: 'm',
      } as never);
      await service.enqueueRelinkJob({
        memoryPartition: 'p',
        model: 'm',
        dryRun: true,
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_RELINK_JOB,
        expect.anything(),
        {
          jobId: 'relink-p-apply',
        },
      );
      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_RELINK_JOB,
        expect.anything(),
        {
          jobId: 'relink-p-dry',
        },
      );
    });

    it('dedupes the conviction job per partition and mode', async () => {
      const { service, queue } = buildService();

      await service.enqueueConvictionJob({
        memoryPartition: 'p',
        model: 'm',
        dryRun: true,
      } as never);
      await service.enqueueConvictionJob({
        memoryPartition: 'p',
        model: 'm',
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_CONVICTION_JOB,
        expect.anything(),
        {
          jobId: 'conviction-p-dry',
        },
      );
      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_CONVICTION_JOB,
        expect.anything(),
        {
          jobId: 'conviction-p-apply',
        },
      );
    });

    it('skips consolidate when no model is configured', async () => {
      const { service, queue } = buildService();

      await service.enqueueConsolidateJob({ memoryPartition: 'p' } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('skips relink when no model is configured', async () => {
      const { service, queue } = buildService();

      await service.enqueueRelinkJob({ memoryPartition: 'p' } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('swallows consolidate queue failures', async () => {
      const { service, queue } = buildService();
      vi.mocked(queue.add).mockRejectedValueOnce(new Error('redis down'));

      await expect(
        service.enqueueConsolidateJob({
          memoryPartition: 'p',
          model: 'm',
        } as never),
      ).resolves.toBeUndefined();
    });
  });

  describe('taxonomy, reflection and cluster jobs', () => {
    it('scopes the taxonomy reconcile job by lane and space', async () => {
      const { service, queue } = buildService();

      await service.enqueueTaxonomyReconcileJob({
        lane: 'cognition',
        scopeKey: 's1',
        model: 'm',
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_TAXONOMY_RECONCILE_JOB,
        expect.anything(),
        { jobId: 'taxonomy-reconcile-cognition-s1-apply' },
      );
    });

    it('skips taxonomy reconcile without a model', async () => {
      const { service, queue } = buildService();

      await service.enqueueTaxonomyReconcileJob({
        lane: 'partition',
        scopeKey: 's',
      } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('scopes the reflect job by lane and space', async () => {
      const { service, queue } = buildService();

      await service.enqueueReflectJob({
        lane: 'partition',
        scopeKey: 's1',
        model: 'm',
        dryRun: true,
      } as never);
      await service.enqueueReflectJob({
        lane: 'partition',
        scopeKey: 's1',
        model: 'm',
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_REFLECT_JOB,
        expect.anything(),
        {
          jobId: 'reflect-partition-s1-dry',
        },
      );
      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_REFLECT_JOB,
        expect.anything(),
        {
          jobId: 'reflect-partition-s1-apply',
        },
      );
    });

    it('skips reflect without a model', async () => {
      const { service, queue } = buildService();

      await service.enqueueReflectJob({
        lane: 'partition',
        scopeKey: 's',
      } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('scopes the cluster job by lane and space', async () => {
      const { service, queue } = buildService();

      await service.enqueueClusterJob({
        lane: 'encyclopedia',
        scopeKey: 'g',
        model: 'm',
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        MEMORY_CLUSTER_JOB,
        expect.anything(),
        {
          jobId: 'cluster-encyclopedia-g-apply',
        },
      );
    });

    it('skips the cluster job without a model', async () => {
      const { service, queue } = buildService();

      await service.enqueueClusterJob({
        lane: 'partition',
        scopeKey: 's',
      } as never);

      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('encyclopedia jobs', () => {
    it('uses a singleton sweep job id', async () => {
      const { service, queue } = buildService();

      await service.enqueueEncyclopediaSweep({ dryRun: true } as never);
      await service.enqueueEncyclopediaSweep({} as never);

      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_CONSOLIDATE_JOB,
        expect.anything(),
        { jobId: 'encyclopedia-consolidate-dry' },
      );
      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_CONSOLIDATE_JOB,
        expect.anything(),
        { jobId: 'encyclopedia-consolidate-apply' },
      );
    });

    it('uses a singleton classify job id', async () => {
      const { service, queue } = buildService();

      await service.enqueueEncyclopediaClassify({ model: 'm' } as never);

      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_CLASSIFY_JOB,
        expect.anything(),
        { jobId: 'encyclopedia-classify-apply' },
      );
    });

    it('skips classify without a model', async () => {
      const { service, queue } = buildService();

      await service.enqueueEncyclopediaClassify({} as never);

      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('research jobs', () => {
    it('uses a singleton id for the root research job', async () => {
      const { service, queue } = buildService();

      await service.enqueueResearchJob({ model: 'm', dryRun: true } as never);
      await service.enqueueResearchJob({ model: 'm' } as never);

      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_RESEARCH_JOB,
        expect.anything(),
        {
          jobId: 'research-root-dry',
        },
      );
      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_RESEARCH_JOB,
        expect.anything(),
        {
          jobId: 'research-root-apply',
        },
      );
    });

    it('dedupes a follow-up chain by chain id and depth', async () => {
      const { service, queue } = buildService();

      await service.enqueueResearchJob({
        model: 'm',
        chainId: 'c1',
        depth: 2,
      } as never);

      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_RESEARCH_JOB,
        expect.anything(),
        {
          jobId: 'research-c1-2',
        },
      );
    });

    it('defaults a chain follow-up depth to 0', async () => {
      const { service, queue } = buildService();

      await service.enqueueResearchJob({ model: 'm', chainId: 'c1' } as never);

      expect(queue.add).toHaveBeenCalledWith(
        ENCYCLOPEDIA_RESEARCH_JOB,
        expect.anything(),
        {
          jobId: 'research-c1-0',
        },
      );
    });

    it('skips research without a model', async () => {
      const { service, queue } = buildService();

      await service.enqueueResearchJob({} as never);

      expect(queue.add).not.toHaveBeenCalled();
    });

    it('swallows research queue failures', async () => {
      const { service, queue } = buildService();
      vi.mocked(queue.add).mockRejectedValueOnce(new Error('redis down'));

      await expect(
        service.enqueueResearchJob({ model: 'm' } as never),
      ).resolves.toBeUndefined();
    });
  });
});

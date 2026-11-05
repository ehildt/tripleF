import type { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import {
  HARNESS_QUEUE,
  VECTORIZE_QUEUE,
} from '../../bullmq/constants/bullmq.constants.js';

import { JobReinstatementService } from './job-reinstatement.service.js';
import type { DeadLetterRepository } from './repository.service.js';

const record = (overrides: Record<string, unknown> = {}) => ({
  id: 'dlq-1',
  queueName: HARNESS_QUEUE,
  jobName: 'interpret',
  payload: { requestId: 'req-1' },
  status: 'Failed',
  ...overrides,
});

const buildQueue = () =>
  ({ add: vi.fn().mockResolvedValue({ id: 42 }) }) as unknown as Queue;
const buildRepository = () =>
  ({
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
  }) as unknown as DeadLetterRepository;

const buildService = () => {
  const harnessQueue = buildQueue();
  const vectorizeQueue = buildQueue();
  const repository = buildRepository();
  const service = new JobReinstatementService(
    harnessQueue,
    vectorizeQueue,
    repository,
  );

  return { service, harnessQueue, vectorizeQueue, repository };
};

describe('JobReinstatementService', () => {
  describe('with explicit ids', () => {
    it('reinstitutes failed records and marks them active', async () => {
      const { service, harnessQueue, repository } = buildService();
      vi.mocked(repository.findById).mockResolvedValue(record() as never);

      const result = await service.reinstate({ ids: ['dlq-1'] });

      expect(repository.findById).toHaveBeenCalledWith('dlq-1');
      expect(harnessQueue.add).toHaveBeenCalledWith('interpret', {
        requestId: 'req-1',
      });
      expect(repository.update).toHaveBeenCalledWith('dlq-1', {
        status: 'Active',
        jobId: '42',
      });
      expect(result).toEqual({ restored: 1, ids: ['dlq-1'] });
    });

    it('routes a vectorize record to the vectorize queue', async () => {
      const { service, vectorizeQueue, repository } = buildService();
      vi.mocked(repository.findById).mockResolvedValue(
        record({ queueName: VECTORIZE_QUEUE }) as never,
      );

      await service.reinstate({ ids: ['dlq-1'] });

      expect(vectorizeQueue.add).toHaveBeenCalledTimes(1);
    });

    it('skips records that are not failed or cleared', async () => {
      const { service, harnessQueue, repository } = buildService();
      vi.mocked(repository.findById).mockResolvedValue(
        record({ status: 'Active' }) as never,
      );

      const result = await service.reinstate({ ids: ['dlq-1'] });

      expect(harnessQueue.add).not.toHaveBeenCalled();
      expect(result).toEqual({ restored: 0, ids: [] });
    });

    it('skips ids that no longer exist', async () => {
      const { service, harnessQueue, repository } = buildService();
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.reinstate({ ids: ['missing'] })).resolves.toEqual({
        restored: 0,
        ids: [],
      });
      expect(harnessQueue.add).not.toHaveBeenCalled();
    });

    it('handles cleared records', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findById).mockResolvedValue(
        record({ status: 'Cleared' }) as never,
      );

      await expect(service.reinstate({ ids: ['dlq-1'] })).resolves.toEqual({
        restored: 1,
        ids: ['dlq-1'],
      });
    });
  });

  describe('without explicit ids', () => {
    it('reinstates the eligible failed batch', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue({
        data: [record({ id: 'a' }), record({ id: 'b' })],
        total: 2,
      } as never);

      const result = await service.reinstate({ batchSize: 25 });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Failed', limit: 25 }),
      );
      expect(result).toEqual({ restored: 2, ids: ['a', 'b'] });
    });

    it('defaults the batch size to 10', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue({
        data: [],
        total: 0,
      } as never);

      await service.reinstate({});

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 }),
      );
    });

    it('only considers records whose retry time has passed', async () => {
      const { service, repository } = buildService();
      vi.mocked(repository.findAll).mockResolvedValue({
        data: [],
        total: 0,
      } as never);

      await service.reinstate({});

      const [options] = vi.mocked(repository.findAll).mock.calls[0];
      expect(options.nextRetryAtBefore).toBeInstanceOf(Date);
    });
  });

  describe('failure handling', () => {
    it('skips records whose queue is not registered', async () => {
      const { service, harnessQueue, repository } = buildService();
      vi.mocked(repository.findById).mockResolvedValue(
        record({ queueName: 'unknown-queue' }) as never,
      );

      const result = await service.reinstate({ ids: ['dlq-1'] });

      expect(harnessQueue.add).not.toHaveBeenCalled();
      expect(result).toEqual({ restored: 0, ids: [] });
    });

    it('keeps reinstating the remaining records when one enqueue fails', async () => {
      const { service, harnessQueue, repository } = buildService();
      vi.mocked(repository.findById)
        .mockResolvedValueOnce(record({ id: 'bad' }) as never)
        .mockResolvedValueOnce(record({ id: 'good' }) as never);
      vi.mocked(harnessQueue.add)
        .mockRejectedValueOnce(new Error('redis down'))
        .mockResolvedValueOnce({ id: '7' } as never);

      const result = await service.reinstate({ ids: ['bad', 'good'] });

      expect(result).toEqual({ restored: 1, ids: ['good'] });
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(repository.update).toHaveBeenCalledWith('good', {
        status: 'Active',
        jobId: '7',
      });
    });
  });
});

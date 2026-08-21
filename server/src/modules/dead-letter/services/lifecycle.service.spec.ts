import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { vi } from 'vitest';

import { BullMQConfigService } from '../../bullmq/configs/bullmq-config.service.js';

import { LifecycleService } from './lifecycle.service.js';
import { DeadLetterRepository } from './repository.service.js';

describe('LifecycleService', () => {
  let service: LifecycleService;
  let dlqRepository: DeadLetterRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifecycleService,
        {
          provide: DeadLetterRepository,
          useValue: {
            findByQueueJob: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            upsertByQueueJob: vi.fn(),
          },
        },
        {
          provide: BullMQConfigService,
          useValue: {
            config: {
              defaultJobOptions: { attempts: 3 },
              failedJobRetryDelayMs: 1000,
            },
          },
        },
      ],
    }).compile();

    service = module.get<LifecycleService>(LifecycleService);
    dlqRepository = module.get<DeadLetterRepository>(DeadLetterRepository);
  });

  function createJob(overrides: Partial<Job> = {}): Job {
    return {
      name: 'req-1',
      queueName: 'harness',
      id: 'job-1',
      attemptsMade: 3,
      data: { meta: [], filters: {} },
      remove: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    } as Job;
  }

  describe('onJobCompleted', () => {
    it('clears the DLQ entry when one exists', async () => {
      vi.mocked(dlqRepository.findByQueueJob).mockResolvedValue({
        id: 'record-1',
      } as never);

      await service.onJobCompleted(createJob());

      expect(dlqRepository.findByQueueJob).toHaveBeenCalledWith(
        'harness',
        'job-1',
      );
      expect(dlqRepository.update).toHaveBeenCalledWith('record-1', {
        status: 'Cleared',
        failedReason: null,
      });
    });

    it('does nothing when no DLQ entry exists', async () => {
      vi.mocked(dlqRepository.findByQueueJob).mockResolvedValue(null);

      await service.onJobCompleted(createJob());

      expect(dlqRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('onJobFailed/handleFailed', () => {
    it('is currently a no-op', async () => {
      await expect(service.onJobFailed()).resolves.toBeUndefined();
    });

    it('records the final failure by (queueName, jobId) and removes the job', async () => {
      const now = Date.now();
      const job = createJob();
      await service.handleFailed(job, 'boom');

      expect(dlqRepository.upsertByQueueJob).toHaveBeenCalledWith(
        { queueName: 'harness', jobId: 'job-1', jobName: 'req-1' },
        expect.objectContaining({
          queueName: 'harness',
          jobId: 'job-1',
          jobName: 'req-1',
          status: 'Failed',
          failedReason: 'boom',
          attemptsMade: 3,
          nextRetryAt: expect.any(Date),
          payload: { meta: [], filters: {} },
        }),
      );
      expect(job.remove).toHaveBeenCalled();

      const [, data] = vi.mocked(dlqRepository.upsertByQueueJob).mock.calls[0];
      const nextRetryAt = data.nextRetryAt as Date;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(now + 1000);
      expect(nextRetryAt.getTime()).toBeLessThan(now + 2000);
    });

    it('skips recording while retry attempts remain', async () => {
      const job = createJob({ attemptsMade: 1 });
      await service.handleFailed(job, 'boom');

      expect(dlqRepository.upsertByQueueJob).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
    });

    it('works for any queue (vectorize job)', async () => {
      const job = createJob({
        name: 'vectorize',
        queueName: 'vectorize',
        id: 'vjob-9',
        data: {
          userId: 'sess-1',
          sessionId: 'sess-1',
          requestId: 'req-42',
          tier: 'episodic',
          role: 'user',
          text: 'Hello',
        },
      });
      await service.handleFailed(job, 'embed 404');

      expect(dlqRepository.upsertByQueueJob).toHaveBeenCalledWith(
        { queueName: 'vectorize', jobId: 'vjob-9', jobName: 'vectorize' },
        expect.objectContaining({
          queueName: 'vectorize',
          jobId: 'vjob-9',
          jobName: 'vectorize',
          status: 'Failed',
          nextRetryAt: expect.any(Date),
          payload: expect.objectContaining({ requestId: 'req-42' }),
        }),
      );
    });
  });

  describe('recordPermanentFailure', () => {
    it('records regardless of remaining attempts', async () => {
      const job = createJob({ attemptsMade: 1 });
      await service.recordPermanentFailure(job, 'model not found');

      expect(dlqRepository.upsertByQueueJob).toHaveBeenCalledWith(
        { queueName: 'harness', jobId: 'job-1', jobName: 'req-1' },
        expect.objectContaining({
          status: 'Failed',
          failedReason: 'model not found',
        }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { vi } from 'vitest';

import { BullMQConfigService } from '../../bullmq/configs/bullmq-config.service.js';
import { HarnessJobPayload } from '../../harness/dtos/harness-job.dto.js';

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
            findById: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
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

  function createJob(
    overrides: Partial<Job<HarnessJobPayload>> = {},
  ): Job<HarnessJobPayload> {
    return {
      name: 'req-1',
      queueName: 'harness',
      id: 'job-1',
      attemptsMade: 3,
      data: { meta: [], filters: {} },
      remove: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    } as Job<HarnessJobPayload>;
  }

  describe('onJobCompleted', () => {
    it('clears the DLQ entry when one exists', async () => {
      vi.mocked(dlqRepository.findById).mockResolvedValue({
        requestId: 'req-1',
      } as any);

      await service.onJobCompleted(createJob());

      expect(dlqRepository.update).toHaveBeenCalledWith('req-1', {
        status: 'Cleared',
        failedReason: null,
      });
    });

    it('does nothing when no DLQ entry exists', async () => {
      vi.mocked(dlqRepository.findById).mockResolvedValue(null);

      await service.onJobCompleted(createJob());

      expect(dlqRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('onJobFailed', () => {
    it('is currently a no-op', async () => {
      await expect(service.onJobFailed()).resolves.toBeUndefined();
    });
  });

  describe('handleFailed', () => {
    it('does nothing when max attempts have not been reached', async () => {
      const job = createJob({ attemptsMade: 1 });

      await service.handleFailed(job, 'boom');

      expect(dlqRepository.upsert).not.toHaveBeenCalled();
      expect(job.remove).not.toHaveBeenCalled();
    });

    it('records final failure and removes the job at max attempts', async () => {
      const now = Date.now();
      const job = createJob({ attemptsMade: 3 });

      await service.handleFailed(job, 'boom');

      expect(dlqRepository.upsert).toHaveBeenCalledWith('req-1', {
        queueName: 'harness',
        jobId: 'job-1',
        status: 'Failed',
        failedAt: expect.any(Date),
        failedReason: 'boom',
        attemptsMade: 3,
        nextRetryAt: expect.any(Date),
        payload: { meta: [], filters: {} },
      });
      expect(job.remove).toHaveBeenCalled();

      const args = vi.mocked(dlqRepository.upsert).mock.calls[0][1];
      const nextRetryAt = args.nextRetryAt as Date;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(now + 1000);
      expect(nextRetryAt.getTime()).toBeLessThan(now + 2000);
    });
  });
});

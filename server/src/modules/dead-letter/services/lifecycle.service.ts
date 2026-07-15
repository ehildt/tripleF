import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { Prisma } from '../../../generated/prisma/client.js';
import { BullMQConfigService } from '../../bullmq/configs/bullmq-config.service.js';
import { HarnessJobPayload } from '../../harness/dtos/harness-job.dto.js';

import { DeadLetterRepository } from './repository.service.js';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    private readonly dlqRepository: DeadLetterRepository,
    private readonly bullMQConfigService: BullMQConfigService,
  ) {}

  async onJobCompleted(job: Job<HarnessJobPayload>): Promise<void> {
    const dlqEntry = await this.dlqRepository.findById(job.name);
    if (!dlqEntry) return;

    await this.dlqRepository.update(job.name, {
      status: 'Cleared',
      failedReason: null,
    } satisfies Prisma.HarnessDlqUpdateInput);
  }

  async onJobFailed(): Promise<void> {}

  async handleFailed(
    job: Job<HarnessJobPayload>,
    failedReason?: string,
  ): Promise<void> {
    if (!this.hasReachedMaxAttempts(job)) return;
    await this.recordFinalFailure(job, this.getRetryDelayMs(), failedReason);
    await this.removeJob(job);
  }

  async recordFinalFailure(
    job: Job<HarnessJobPayload>,
    retryDelayMs: number,
    failedReason?: string,
  ): Promise<void> {
    await this.dlqRepository.upsert(job.name, {
      queueName: job.queueName,
      jobId: String(job.id),
      status: 'Failed',
      failedAt: new Date(),
      failedReason,
      attemptsMade: job.attemptsMade,
      nextRetryAt: new Date(Date.now() + retryDelayMs),
      payload: job.data as any,
    });
  }

  private hasReachedMaxAttempts(job: Job<HarnessJobPayload>): boolean {
    const maxAttempts =
      this.bullMQConfigService.config.defaultJobOptions.attempts ?? 3;
    return job.attemptsMade >= maxAttempts;
  }

  private getRetryDelayMs(): number {
    return this.bullMQConfigService.config.failedJobRetryDelayMs;
  }

  private async removeJob(job: Job<HarnessJobPayload>): Promise<void> {
    try {
      await job.remove();
    } catch (err) {
      this.logger.error('Failed to remove dead job from BullMQ:', err);
    }
  }
}

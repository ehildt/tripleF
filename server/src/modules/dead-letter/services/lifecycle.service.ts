import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { Prisma } from '../../../generated/prisma/client.js';
import { BullMQConfigService } from '../../bullmq/configs/bullmq-config.service.js';

import { DeadLetterRepository } from './repository.service.js';

/**
 * Generic dead-letter lifecycle for all queues. Job identity is the
 * technical pair (queueName, jobId); the BullMQ job name rides along as
 * `jobName` (for harness jobs that name IS the request id, which the
 * dashboard displays). The application-failure map is harness-specific:
 * step-engine failures complete their jobs, so the completed hook records
 * their DLQ entries instead.
 */
@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    private readonly dlqRepository: DeadLetterRepository,
    private readonly bullMQConfigService: BullMQConfigService,
  ) {}

  /**
   * Job names whose run ended in an application-level error. Application
   * failures complete the BullMQ job (the step engine catches step errors),
   * so they reach the DLQ from the completed hook instead of the failed one.
   */
  private readonly applicationFailures = new Map<string, string>();

  /** Mark a completed-with-error run so the completed hook records a DLQ
   *  entry for it instead of clearing one. (Harness: job name = request id.) */
  markApplicationFailure(requestId: string, failedReason: string): void {
    this.applicationFailures.set(requestId, failedReason);
  }

  async onJobCompleted(job: Job): Promise<void> {
    const failedReason = this.applicationFailures.get(job.name);
    if (failedReason !== undefined) {
      this.applicationFailures.delete(job.name);
      await this.recordFinalFailure(job, this.getRetryDelayMs(), failedReason);
      return;
    }

    const dlqEntry = await this.dlqRepository.findByQueueJob(
      job.queueName,
      String(job.id),
    );
    if (!dlqEntry) return;

    await this.dlqRepository.update(dlqEntry.id, {
      status: 'Cleared',
      failedReason: null,
    });
  }

  async onJobFailed(): Promise<void> {}

  /**
   * Reached-max-attempts bookkeeping, generic across queues: record the final
   * failure, then drop the dead BullMQ job (the DLQ record is the copy).
   */
  async handleFailed(job: Job, failedReason?: string): Promise<void> {
    this.applicationFailures.delete(job.name);
    if (!this.hasReachedMaxAttempts(job)) return;
    await this.recordFinalFailure(job, this.getRetryDelayMs(), failedReason);
    await this.removeJob(job);
  }

  /**
   * Record a failure that can never succeed on retry (the caller is about to
   * throw UnrecoverableError — the job is final despite attempts remaining).
   */
  async recordPermanentFailure(job: Job, failedReason: string): Promise<void> {
    await this.recordFinalFailure(job, this.getRetryDelayMs(), failedReason);
  }

  async recordFinalFailure(
    job: Job,
    retryDelayMs: number,
    failedReason?: string,
  ): Promise<void> {
    await this.dlqRepository.upsertByQueueJob(
      {
        queueName: job.queueName,
        jobId: String(job.id),
        jobName: job.name,
      },
      {
        queueName: job.queueName,
        jobId: String(job.id),
        jobName: job.name,
        status: 'Failed',
        failedAt: new Date(),
        failedReason,
        attemptsMade: job.attemptsMade,
        nextRetryAt: new Date(Date.now() + retryDelayMs),
        payload: (job.data ?? {}) as Prisma.InputJsonValue,
      },
    );
  }

  private hasReachedMaxAttempts(job: Job): boolean {
    const maxAttempts =
      this.bullMQConfigService.config.defaultJobOptions.attempts ?? 3;
    return job.attemptsMade >= maxAttempts;
  }

  private getRetryDelayMs(): number {
    return this.bullMQConfigService.config.failedJobRetryDelayMs;
  }

  private async removeJob(job: Job): Promise<void> {
    try {
      await job.remove();
    } catch (err) {
      this.logger.error('Failed to remove dead job from BullMQ:', err);
    }
  }
}

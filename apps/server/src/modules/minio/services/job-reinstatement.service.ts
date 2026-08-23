import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  HARNESS_QUEUE,
  VECTORIZE_QUEUE,
} from '../../bullmq/constants/bullmq.constants.js';
import { DeadLetterRepository } from '../../dead-letter/services/repository.service.js';

import type { ReinstateOptions } from './job-reinstatement.service.types.js';

/**
 * Re-enqueues dead-lettered jobs back into their origin queue. The queue is
 * resolved from the record's queueName via the registry — new queues join the
 * registry to become reinstatable. Re-adding produces a fresh BullMQ job id;
 * the record is updated in place (status Active + new jobId) so one logical
 * job keeps a single failure/retry history across reinstate cycles.
 */
@Injectable()
export class JobReinstatementService {
  private readonly logger = new Logger(JobReinstatementService.name);
  private readonly queues: Map<string, Queue>;

  constructor(
    @InjectQueue(HARNESS_QUEUE)
    private readonly harnessQueue: Queue,
    @InjectQueue(VECTORIZE_QUEUE)
    private readonly vectorizeQueue: Queue,
    private readonly dlqRepository: DeadLetterRepository,
  ) {
    this.queues = new Map<string, Queue>([
      [HARNESS_QUEUE, this.harnessQueue],
      [VECTORIZE_QUEUE, this.vectorizeQueue],
    ]);
  }

  async reinstate(options: ReinstateOptions) {
    let records: NonNullable<
      Awaited<ReturnType<typeof this.dlqRepository.findById>>
    >[];

    if (options.ids?.length) {
      const rows = await Promise.all(
        options.ids.map((id) => this.dlqRepository.findById(id)),
      );
      records = rows.filter(
        (r): r is NonNullable<typeof r> =>
          !!r && (r.status === 'Failed' || r.status === 'Cleared'),
      );
    } else {
      const { data } = await this.dlqRepository.findAll({
        status: 'Failed',
        nextRetryAtBefore: new Date(),
        limit: options.batchSize ?? 10,
      });
      records = data;
    }

    const restored: string[] = [];

    for (const record of records) {
      const queue = this.queues.get(record.queueName);
      if (!queue) {
        this.logger.warn(
          `No queue registered for "${record.queueName}" — skipping ${record.id}`,
        );
        continue;
      }
      try {
        const newJob = await queue.add(record.jobName, record.payload as never);
        await this.dlqRepository.update(record.id, {
          status: 'Active',
          jobId: String(newJob.id),
        });
        restored.push(record.id);
      } catch (err) {
        this.logger.error(`Failed to reinstate DLQ record ${record.id}:`, err);
      }
    }

    return { restored: restored.length, ids: restored };
  }
}

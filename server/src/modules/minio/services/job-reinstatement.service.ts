import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { HARNESS_QUEUE } from '../../../constants/bullmq.constants.js';
import { DeadLetterRepository } from '../../dead-letter/services/repository.service.js';
import { HarnessJobPayload } from '../../harness/dtos/harness-job.dto.js';

@Injectable()
export class JobReinstatementService {
  private readonly logger = new Logger(JobReinstatementService.name);

  constructor(
    @InjectQueue(HARNESS_QUEUE)
    private readonly queue: Queue,
    private readonly dlqRepository: DeadLetterRepository,
  ) {}

  async reinstate(options: { requestIds?: string[]; batchSize?: number }) {
    let records: Awaited<ReturnType<typeof this.dlqRepository.findAll>>['data'];

    if (options.requestIds?.length) {
      const rows = await Promise.all(
        options.requestIds.map((id) => this.dlqRepository.findById(id)),
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
      try {
        const payload: HarnessJobPayload = {
          meta: (record.payload as any)?.meta ?? [],
          filters: (record.payload as any)?.filters ?? {},
        };

        await this.queue.add(record.requestId, payload);

        await this.dlqRepository.update(record.requestId, {
          status: 'Active',
        });

        restored.push(record.requestId);
      } catch (err) {
        this.logger.error(`Failed to reinstate job ${record.requestId}:`, err);
      }
    }

    return { restored: restored.length, requestIds: restored };
  }
}

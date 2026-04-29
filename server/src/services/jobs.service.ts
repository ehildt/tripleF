import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { BULLMQ_QUEUE } from '../constants/bullmq.constants.js';
import { VisionJobPayload } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';

import { PostgresService } from './postgres.service.js';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(BULLMQ_QUEUE.IMAGE_DESCRIBE)
    private readonly describeQueue: Queue,
    @InjectQueue(BULLMQ_QUEUE.IMAGE_COMPARE)
    private readonly compareQueue: Queue,
    @InjectQueue(BULLMQ_QUEUE.IMAGE_OCR)
    private readonly ocrQueue: Queue,
    private readonly postgresService: PostgresService,
  ) {}

  async reinstate(options: { requestIds?: string[]; batchSize?: number }) {
    let records: Awaited<
      ReturnType<typeof this.postgresService.findAll>
    >['data'];

    if (options.requestIds?.length) {
      const rows = await Promise.all(
        options.requestIds.map((id) => this.postgresService.findById(id)),
      );
      records = rows.filter(
        (r): r is NonNullable<typeof r> => !!r && r.status === 'PENDING_RETRY',
      );
    } else {
      const { data } = await this.postgresService.findAll({
        status: 'PENDING_RETRY',
        nextRetryAtBefore: new Date(),
        limit: options.batchSize ?? 10,
      });
      records = data;
    }

    const restored: string[] = [];

    for (const record of records) {
      try {
        const payload: VisionJobPayload = {
          meta: (record.payload as any)?.meta ?? [],
          filters: (record.payload as any)?.filters ?? {},
        };

        const queue = this.resolveQueue(record.queueName);
        await queue.add(record.requestId, payload);

        await this.postgresService.update(record.requestId, {
          status: 'REINSERTED',
        });

        restored.push(record.requestId);
      } catch (err) {
        this.logger.error(`Failed to reinstate job ${record.requestId}:`, err);
      }
    }

    return { restored: restored.length, requestIds: restored };
  }

  private resolveQueue(queueName: string): Queue {
    if (queueName === BULLMQ_QUEUE.IMAGE_DESCRIBE) return this.describeQueue;
    if (queueName === BULLMQ_QUEUE.IMAGE_COMPARE) return this.compareQueue;
    return this.ocrQueue;
  }
}

import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';

import { BullMQConfigService } from '../configs/bullmq-config.service.js';
import {
  HARNESS_QUEUE,
  HARNESS_WORKER_CONCURRENCY,
} from '../constants/bullmq.constants.js';

@ApiTags('BullMQ')
@Controller('bullmq')
export class BullMQController {
  constructor(
    @InjectQueue(HARNESS_QUEUE)
    private readonly queue: Queue,
    private readonly bullMQConfigService: BullMQConfigService,
  ) {}

  @Get('live')
  async getLiveJobs() {
    const jobs = await this.queue.getJobs([
      'waiting',
      'active',
      'delayed',
      'completed',
      'failed',
    ]);

    return {
      jobs: jobs.map((j) => ({
        id: j.id,
        name: j.name,
        state: j.getState(),
        attemptsMade: j.attemptsMade,
      })),
    };
  }

  @Get('retry-config')
  getRetryConfig() {
    const { config } = this.bullMQConfigService;
    return {
      attempts: config.defaultJobOptions.attempts,
      backoffDelay: config.defaultJobOptions.backoff.delay,
      backoffType: config.defaultJobOptions.backoff.type,
      workerConcurrency: HARNESS_WORKER_CONCURRENCY,
      failedJobRetryDelayMs: config.failedJobRetryDelayMs,
      failedJobReinstateBatchSize: config.failedJobReinstateBatchSize,
    };
  }
}

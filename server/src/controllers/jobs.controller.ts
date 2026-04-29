import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';

import { BullMQConfigService } from '../configs/bullmq-config.service.js';
import {
  BULLMQ_QUEUE,
  BULLMQ_WORKER_CONCURRENCY,
} from '../constants/bullmq.constants.js';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    @InjectQueue(BULLMQ_QUEUE.IMAGE_DESCRIBE)
    private readonly describeQueue: Queue,
    @InjectQueue(BULLMQ_QUEUE.IMAGE_COMPARE)
    private readonly compareQueue: Queue,
    @InjectQueue(BULLMQ_QUEUE.IMAGE_OCR)
    private readonly ocrQueue: Queue,
    private readonly bullMQConfigService: BullMQConfigService,
  ) {}

  @Get('live')
  async getLiveJobs() {
    const [describeJobs, compareJobs, ocrJobs] = await Promise.all([
      this.describeQueue.getJobs([
        'waiting',
        'active',
        'delayed',
        'completed',
        'failed',
      ]),
      this.compareQueue.getJobs([
        'waiting',
        'active',
        'delayed',
        'completed',
        'failed',
      ]),
      this.ocrQueue.getJobs([
        'waiting',
        'active',
        'delayed',
        'completed',
        'failed',
      ]),
    ]);

    return {
      describe: describeJobs.map((j) => ({
        id: j.id,
        name: j.name,
        state: j.getState(),
        attemptsMade: j.attemptsMade,
      })),
      compare: compareJobs.map((j) => ({
        id: j.id,
        name: j.name,
        state: j.getState(),
        attemptsMade: j.attemptsMade,
      })),
      ocr: ocrJobs.map((j) => ({
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
      workerConcurrency: BULLMQ_WORKER_CONCURRENCY,
      failedJobRetryDelayMs: config.failedJobRetryDelayMs,
      failedJobReinstateBatchSize: config.failedJobReinstateBatchSize,
    };
  }
}

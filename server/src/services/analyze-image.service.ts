import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import { MultipartFile } from '@fastify/multipart';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { BULLMQ_QUEUE } from '../constants/bullmq.constants.js';
import {
  FastifyMultipartDataWithFiltersReq,
  FastifyMultipartMeta,
} from '../dtos/classic/get-fastify-multipart-data-req.dto.js';

import { JobTrackingService } from './job-tracking.service.js';

@Injectable()
export class AnalyzeImageService {
  private readonly logger = new Logger(AnalyzeImageService.name);

  constructor(
    @InjectQueue(BULLMQ_QUEUE.IMAGE_DESCRIBE)
    private readonly describeQueue: Queue,
    @InjectQueue(BULLMQ_QUEUE.IMAGE_COMPARE)
    private readonly compareQueue: Queue,
    @InjectQueue(BULLMQ_QUEUE.IMAGE_OCR)
    private readonly ocrQueue: Queue,
    private readonly jobTracking: JobTrackingService,
  ) {}

  async toFilePayloads(requestId: string, images: Array<MultipartFile>) {
    return await Promise.all(
      images.map(async (file) => {
        const buffer = await file.toBuffer();
        const meta: FastifyMultipartMeta = {
          name: file.filename,
          type: file.mimetype,
          hash: `${hashPayload(buffer, 'sha256')}_${requestId}`,
        };
        return { buffer, meta };
      }),
    );
  }

  async emit(
    req: FastifyMultipartDataWithFiltersReq,
  ): Promise<Job | undefined> {
    const requestId = req.filters.requestId!;

    let job: Job | undefined;
    let queueName: string | undefined;

    try {
      if (req.filters.task === 'describe') {
        job = await this.describeQueue.add(requestId, req);
        queueName = BULLMQ_QUEUE.IMAGE_DESCRIBE;
      } else if (req.filters.task === 'compare') {
        job = await this.compareQueue.add(requestId, req);
        queueName = BULLMQ_QUEUE.IMAGE_COMPARE;
      } else if (req.filters.task === 'ocr') {
        job = await this.ocrQueue.add(requestId, req);
        queueName = BULLMQ_QUEUE.IMAGE_OCR;
      }
    } catch (err) {
      this.logger.error(`Failed to add job ${requestId} to queue:`, err);
      return undefined;
    }

    if (job && queueName) {
      // Check if already canceled before it even hit the queue
      if (this.jobTracking.isCanceled(requestId)) {
        try {
          await job.remove();
        } catch (err) {
          this.logger.error(`Failed to remove job ${requestId}:`, err);
        }
        return undefined;
      }

      this.jobTracking.add(requestId, queueName, job.id!);
    }

    return job;
  }

  async cancel(requestId: string): Promise<boolean> {
    const trackedJob = this.jobTracking.get(requestId);

    if (!trackedJob) {
      // Job hasn't been queued yet - track it as canceled
      // so when emit() is called, it won't be added to queue
      this.jobTracking.cancel(requestId);
      return true;
    }

    // Mark as canceled in tracking
    const marked = this.jobTracking.cancel(requestId);
    if (!marked) return false;

    // If still pending, remove from queue
    if (trackedJob.status === 'pending') {
      let queue: Queue | undefined;

      if (trackedJob.queueName === BULLMQ_QUEUE.IMAGE_DESCRIBE)
        queue = this.describeQueue;
      else if (trackedJob.queueName === BULLMQ_QUEUE.IMAGE_COMPARE)
        queue = this.compareQueue;
      else if (trackedJob.queueName === BULLMQ_QUEUE.IMAGE_OCR)
        queue = this.ocrQueue;

      if (queue) {
        try {
          const job = await Job.fromId(queue, trackedJob.jobId);
          if (job) {
            await job.remove();
          }
        } catch (err) {
          this.logger.error(`Failed to remove job ${requestId}:`, err);
        }
      }
    }

    // If active, it will check cancel status in onChunk and exit early
    return true;
  }
}

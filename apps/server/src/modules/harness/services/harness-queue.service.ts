import { MultipartFile } from '@fastify/multipart';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { hashPayload } from '@triplef/helpers/hash-payload';
import { Job, Queue } from 'bullmq';

import { HARNESS_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import { MinioService } from '../../minio/services/minio.service.js';
import {
  FastifyMultipartDataWithFiltersReq,
  FastifyMultipartMeta,
} from '../dtos/harness-job.dto.js';
import { buildImageFingerprint } from '../helpers/media/build-image-fingerprint.helper.js';

import { HarnessCancellationService } from './harness-cancellation.service.js';

@Injectable()
export class HarnessQueueService {
  private readonly logger = new Logger(HarnessQueueService.name);

  constructor(
    @InjectQueue(HARNESS_QUEUE)
    private readonly queue: Queue,
    private readonly minioService: MinioService,
    private readonly cancellationService: HarnessCancellationService,
  ) {}

  async toFilePayloads(
    images: Array<MultipartFile>,
    providedHashes?: string[],
  ) {
    return await Promise.all(
      images.map(async (file, index) => {
        const buffer = await file.toBuffer();
        const hash =
          providedHashes?.[index] ?? `${hashPayload(buffer, 'sha256')}`;
        const fingerprint = await buildImageFingerprint(buffer);
        const meta: FastifyMultipartMeta = {
          name: file.filename,
          type: file.mimetype,
          hash,
          fingerprint,
          size: buffer.length,
        };
        return { buffer, meta };
      }),
    );
  }

  async emit(
    req: FastifyMultipartDataWithFiltersReq,
  ): Promise<Job | undefined> {
    const requestId = req.filters.requestId!;

    try {
      await this.minioService.uploadBuffers(
        req.filters.sessionId,
        req.filters.conversationId,
        requestId,
        req.buffers.filter(Boolean),
        req.meta.filter(Boolean),
      );
    } catch (err) {
      this.logger.error(
        {
          requestId,
          step: 'queue',
          err: err instanceof Error ? err : new Error(String(err)),
        },
        `Failed to upload buffers to MinIO for job ${requestId}`,
      );
      return undefined;
    }

    const payload = {
      meta: req.meta.filter(Boolean),
      filters: req.filters,
    };

    let job: Job | undefined;

    try {
      job = await this.queue.add(requestId, payload);
    } catch (err) {
      this.logger.error(
        {
          requestId,
          step: 'queue',
          err: err instanceof Error ? err : new Error(String(err)),
        },
        `Failed to add job ${requestId} to queue`,
      );
      try {
        await this.minioService.deleteBuffers(requestId);
      } catch (cleanupErr) {
        this.logger.error(
          {
            requestId,
            step: 'queue',
            err:
              cleanupErr instanceof Error
                ? cleanupErr
                : new Error(String(cleanupErr)),
          },
          `Failed to clean up MinIO buffers for ${requestId}`,
        );
      }
      return undefined;
    }

    return job;
  }

  async cancel(requestId: string): Promise<boolean> {
    const aborted = this.cancellationService.cancel(requestId);

    try {
      const jobs = await this.queue.getJobs(['waiting', 'delayed']);
      const job = jobs.find((j) => j.name === requestId);
      if (job) {
        await job.remove();
        await this.minioService.deleteBuffers(requestId);
        return true;
      }
    } catch (err) {
      this.logger.error(
        {
          requestId,
          step: 'queue',
          err: err instanceof Error ? err : new Error(String(err)),
        },
        `Failed to cancel job ${requestId}`,
      );
    }

    return aborted;
  }
}

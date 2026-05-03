import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import { MultipartFile } from '@fastify/multipart';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { HARNESS_QUEUE } from '../../../constants/bullmq.constants.js';
import { type ThinkMode } from '../../ai-sdk/helpers/ollama.helpers.js';
import { MinioService } from '../../minio/services/minio.service.js';
import {
  FastifyMultipartDataWithFiltersReq,
  FastifyMultipartMeta,
} from '../dtos/harness-job.dto.js';

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
        const meta: FastifyMultipartMeta = {
          name: file.filename,
          type: file.mimetype,
          hash,
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
        `Failed to upload buffers to MinIO for job ${requestId}:`,
        err,
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
      this.logger.error(`Failed to add job ${requestId} to queue:`, err);
      try {
        await this.minioService.deleteBuffers(requestId);
      } catch (cleanupErr) {
        this.logger.error(
          `Failed to clean up MinIO buffers for ${requestId}:`,
          cleanupErr,
        );
      }
      return undefined;
    }

    return job;
  }

  async emitCompact(payload: {
    exchanges: Array<{ role: string; content: string }>;
    model: string;
    requestId: string;
    roomId?: string;
    stream?: boolean;
    event: string;
    think?: ThinkMode;
    keepAlive?: string;
    numCtx?: number;
  }): Promise<Job | undefined> {
    try {
      return await this.queue.add(payload.requestId, {
        meta: [],
        filters: {
          compact: true,
          requestId: payload.requestId,
          exchanges: payload.exchanges,
          model: payload.model,
          roomId: payload.roomId,
          stream: payload.stream ?? false,
          event: payload.event,
          think: payload.think as any,
          keepAlive: payload.keepAlive,
          numCtx: payload.numCtx,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to add compact job ${payload.requestId} to queue:`,
        err,
      );
      return undefined;
    }
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
      this.logger.error(`Failed to cancel job ${requestId}:`, err);
    }

    return aborted;
  }
}

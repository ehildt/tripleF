import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import { MultipartFile } from '@fastify/multipart';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import { type ThinkMode } from '../../ai-sdk/types/think-mode.type.js';
import { HARNESS_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import { MinioService } from '../../minio/services/minio.service.js';
import {
  FastifyMultipartDataWithFiltersReq,
  FastifyMultipartMeta,
} from '../dtos/harness-job.dto.js';
import { buildImageFingerprint } from '../helpers/build-image-fingerprint.helper.js';

import { HarnessCancellationService } from './harness-cancellation.service.js';
import { HarnessStepLogger } from './harness-step-logger.service.js';

type CompactExchange = { role: string; content: string };

type EmitCompactPayload = {
  exchanges: CompactExchange[];
  model: string;
  requestId: string;
  roomId?: string;
  stream?: boolean;
  event: string;
  think?: ThinkMode;
  keepAlive?: string;
  numCtx?: number;
};

@Injectable()
export class HarnessQueueService {
  constructor(
    @InjectQueue(HARNESS_QUEUE)
    private readonly queue: Queue,
    private readonly minioService: MinioService,
    private readonly cancellationService: HarnessCancellationService,
    private readonly stepLogger: HarnessStepLogger,
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
      this.stepLogger.error(
        { requestId },
        'queue',
        `Failed to upload buffers to MinIO for job ${requestId}`,
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
      this.stepLogger.error(
        { requestId },
        'queue',
        `Failed to add job ${requestId} to queue`,
        err,
      );
      try {
        await this.minioService.deleteBuffers(requestId);
      } catch (cleanupErr) {
        this.stepLogger.error(
          { requestId },
          'queue',
          `Failed to clean up MinIO buffers for ${requestId}`,
          cleanupErr,
        );
      }
      return undefined;
    }

    return job;
  }

  async emitCompact(payload: EmitCompactPayload): Promise<Job | undefined> {
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
      this.stepLogger.error(
        { requestId: payload.requestId },
        'queue',
        `Failed to add compact job ${payload.requestId} to queue`,
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
      this.stepLogger.error(
        { requestId },
        'queue',
        `Failed to cancel job ${requestId}`,
        err,
      );
    }

    return aborted;
  }
}

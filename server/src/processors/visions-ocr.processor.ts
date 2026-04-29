import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OllamaService } from '@ehildt/nestjs-ollama';
import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Processor } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';

import { BullMQConfigService } from '../configs/bullmq-config.service.js';
import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import {
  BULLMQ_QUEUE,
  BULLMQ_WORKER_CONCURRENCY,
} from '../constants/bullmq.constants.js';
import { VisionJobPayload } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { ImagePreprocessingService } from '../services/image-preprocessing.service.js';
import { JobTrackingService } from '../services/job-tracking.service.js';
import { MinioService } from '../services/minio.service.js';
import { PostgresService } from '../services/postgres.service.js';

import { VisionsProcessor } from './visions.processor.js';

@Processor(BULLMQ_QUEUE.IMAGE_OCR, { concurrency: BULLMQ_WORKER_CONCURRENCY })
export class VisionsOCRProcessor extends VisionsProcessor {
  constructor(
    protected readonly io: SocketIOService,
    protected readonly ollamaService: OllamaService,
    protected readonly ollamaConfigService: OllamaConfigService,
    protected readonly socketIOConfigService: SocketIOConfigService,
    protected readonly bullMQLogger: BullMQLoggerService,
    protected readonly jobTracking: JobTrackingService,
    protected readonly minioService: MinioService,
    protected readonly postgresService: PostgresService,
    protected readonly bullMQConfigService: BullMQConfigService,
    private readonly imagePreprocessingService: ImagePreprocessingService,
  ) {
    super(
      io,
      ollamaService,
      ollamaConfigService,
      socketIOConfigService,
      bullMQLogger,
      jobTracking,
      minioService,
      postgresService,
      bullMQConfigService,
    );
  }

  async process(job: Job<VisionJobPayload>, token?: string) {
    const requestId = job.name;

    // Early cancel check - exit immediately if job was canceled while in queue
    if (this.jobTracking.isCanceled(requestId)) {
      await this.emitToSocket(job.data.filters.roomId, job.data.filters.event, {
        requestId,
        status: 'canceled',
        canceled: true,
        pending: false,
      });
      throw new UnrecoverableError('Job canceled before processing');
    }

    const { meta, filters } = job.data;

    // Fetch buffers from MinIO
    const buffers = await this.fetchBuffers(requestId);
    this.validateInput(meta);

    // Preprocess images if enabled
    let processedBuffers = buffers;
    let processedMeta = meta;
    let variantDescriptions: string[] | undefined;

    if (filters.preprocessing?.enabled) {
      try {
        const preprocessed =
          await this.imagePreprocessingService.preprocessImages(
            buffers,
            meta,
            filters.preprocessing,
          );
        processedBuffers = preprocessed.map((p) => p.buffer);
        processedMeta = preprocessed.map((p) => p.meta);
        variantDescriptions = preprocessed.map((p) => p.description);
      } catch (error) {
        this.logger.error(
          `Preprocessing failed for request ${requestId}:`,
          error,
        );
        // Fall back to original images if preprocessing fails
        processedBuffers = buffers;
        processedMeta = meta;
      }
    }

    const filenames = processedMeta.map(({ name }) => name).join(',');
    const request = this.buildChatRequest(
      processedBuffers,
      filenames,
      filters,
      'OCR',
      'Image(s):',
      variantDescriptions,
    );

    await this.handleVision(
      job,
      request,
      filters.stream ?? false,
      async (response) => {
        await this.emitToSocket(filters.roomId, filters.event, {
          requestId,
          task: filters.task,
          meta: response?.done ? processedMeta : undefined,
          ...response,
        });
      },
      requestId,
      token,
      filters.roomId,
      filters.event,
    );
  }
}

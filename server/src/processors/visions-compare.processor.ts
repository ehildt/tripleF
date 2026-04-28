import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OllamaService } from '@ehildt/nestjs-ollama';
import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Processor } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';

import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { BULLMQ_QUEUE } from '../constants/bullmq.constants.js';
import { FastifyMultipartDataWithFiltersReq } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { ImagePreprocessingService } from '../services/image-preprocessing.service.js';
import { JobTrackingService } from '../services/job-tracking.service.js';

import { VisionsProcessor } from './visions.processor.js';

@Processor(BULLMQ_QUEUE.IMAGE_COMPARE)
export class VisionsCompareProcessor extends VisionsProcessor {
  constructor(
    protected readonly io: SocketIOService,
    protected readonly ollamaService: OllamaService,
    protected readonly ollamaConfigService: OllamaConfigService,
    protected readonly socketIOConfigService: SocketIOConfigService,
    protected readonly bullMQLogger: BullMQLoggerService,
    protected readonly jobTracking: JobTrackingService,
    private readonly imagePreprocessingService: ImagePreprocessingService,
  ) {
    super(
      io,
      ollamaService,
      ollamaConfigService,
      socketIOConfigService,
      bullMQLogger,
      jobTracking,
    );
  }

  async process(job: Job<FastifyMultipartDataWithFiltersReq>, token?: string) {
    const requestId = job.name;
    this.logger.log(
      `📦 image-compare(${requestId}) 🆔 ID-${job.id} 🔄 Attempts-${job.attemptsMade} 🟣 active`,
    );

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

    const { buffers, meta, filters } = job.data;
    this.validateInput(buffers, meta);

    if (!filters.vLLM) throw new Error('Missing x-vision-llm');

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
      'COMPARE',
      'Images:',
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

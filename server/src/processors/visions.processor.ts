import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OllamaService } from '@ehildt/nestjs-ollama';
import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { ChatResponse, Message } from 'ollama';

import { BullMQConfigService } from '../configs/bullmq-config.service.js';
import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { VisionJobPayload } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { JobTrackingService } from '../services/job-tracking.service.js';
import { MinioService } from '../services/minio.service.js';
import { PostgresService } from '../services/postgres.service.js';

export type SystemPromptKey = 'DESCRIBE' | 'COMPARE' | 'OCR';

@Injectable()
export abstract class VisionsProcessor extends WorkerHost {
  protected readonly logger = new Logger(this.constructor.name);

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
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async process(_job: Job<VisionJobPayload>) {
    throw new Error('Not implemented - override in subclass');
  }

  protected validateInput(meta: unknown): void {
    if (!Array.isArray(meta) || !meta.length) throw new Error('Missing meta');
  }

  protected async fetchBuffers(requestId: string): Promise<Buffer[]> {
    return this.minioService.downloadBuffers(requestId);
  }

  protected async handleVision(
    job: Job<VisionJobPayload>,
    request: Parameters<typeof this.ollamaService.chat>[0],
    stream: boolean,
    onChunk: (response: ChatResponse) => Promise<void>,
    requestId: string,
    token: string | undefined,
    roomId?: string,
    event?: string,
  ): Promise<void> {
    let cancelHandled = false;

    const wrappedOnChunk = async (response: ChatResponse) => {
      if (this.jobTracking.isCanceled(requestId)) {
        if (cancelHandled) return;
        cancelHandled = true;
        await this.emitToSocket(roomId, event, {
          requestId,
          status: 'canceled',
          canceled: true,
          pending: false,
        });
        if (token) {
          try {
            await job.moveToCompleted('canceled', token, true);
          } catch (error) {
            this.logger.error('moveToCompleted', error);
            // Lock may have expired for long-running jobs - this is expected
            // The UnrecoverableError below will ensure no retries happen
          }
        }
        throw new UnrecoverableError('Job canceled during streaming');
      }

      try {
        await onChunk(response);
      } catch (error) {
        this.logger.error('onChunk', error);
      }
    };

    if (stream) await this.ollamaService.chat(request, wrappedOnChunk);
    else {
      if (this.jobTracking.isCanceled(requestId)) {
        await this.emitToSocket(roomId, event, {
          requestId,
          status: 'canceled',
          canceled: true,
          pending: false,
        });
        throw new UnrecoverableError('Job canceled');
      }
      const reply = await this.ollamaService.chat(request);

      if (this.jobTracking.isCanceled(requestId)) {
        await this.emitToSocket(roomId, event, {
          requestId,
          status: 'canceled',
          canceled: true,
          pending: false,
        });
        throw new UnrecoverableError('Job canceled');
      }

      const message = reply?.message;
      if (message) await wrappedOnChunk({ message } as ChatResponse);
    }
  }

  protected buildChatRequest(
    buffers: Buffer[],
    filenames: string,
    filters: VisionJobPayload['filters'],
    systemPromptKey: SystemPromptKey,
    userMessagePrefix: string = 'Image(s):',
    variantDescriptions?: string[],
  ) {
    const systemPrompt: Message = {
      role: 'system',
      content: this.ollamaConfigService.config.systemPrompts[systemPromptKey],
    };

    const variants = variantDescriptions?.reduce(
      (acc, desc, index) => `${acc} ${index}: ${desc}`,
      '',
    );

    const content = !variants?.length
      ? `${userMessagePrefix} ${filenames}`
      : [
          `${userMessagePrefix} ${filenames}`,
          `Image variants provided: ${variants}`,
        ].join('\n');

    const userMessage: Message = {
      role: 'user',
      images: buffers,
      content,
    };

    const prompts: Message[] = (filters.prompt ?? []).filter(
      (p): p is Message =>
        p &&
        typeof p.role === 'string' &&
        typeof p.content === 'string' &&
        p.content.trim().length > 0,
    );

    const messages: Message[] = [systemPrompt, ...prompts, userMessage].filter(
      Boolean,
    );

    return {
      messages,
      options: { num_ctx: filters.numCtx },
      stream: filters.stream,
      model: filters.vLLM!,
      keep_alive: this.ollamaConfigService.config.keepAlive,
    };
  }

  protected async emitToSocket(
    roomId: string | undefined,
    event: string | undefined,
    data: unknown,
  ): Promise<void> {
    const socketEvent = event ?? 'vision';
    try {
      const payload = { event: socketEvent, ...(data as object) };
      if (roomId) this.io.emitTo(socketEvent, roomId, payload);
      else this.io.emit(socketEvent, payload);
    } catch (error) {
      //
    }
  }

  @OnWorkerEvent('completed')
  protected async onCompleted(job: Job<VisionJobPayload>) {
    try {
      await this.bullMQLogger.log(job, 'completed');
    } catch (err) {
      this.logger.error('bullMQLogger.log failed in onCompleted:', err);
    }

    try {
      await this.minioService.deleteBuffers(job.name);
    } catch (err) {
      this.logger.error(`Failed to delete MinIO buffers for ${job.name}:`, err);
    }

    try {
      const dlqEntry = await this.postgresService.findById(job.name);
      if (dlqEntry) {
        await this.postgresService.update(job.name, {
          status: 'ARCHIVED',
          failedReason: null,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to archive DLQ entry for ${job.name}:`, err);
    }

    this.jobTracking.remove(job.name);
  }

  @OnWorkerEvent('active')
  protected async onActive(job: Job<VisionJobPayload>) {
    try {
      await this.bullMQLogger.log(job, 'active');
    } catch (err) {
      this.logger.error('bullMQLogger.log failed in onActive:', err);
    }

    this.jobTracking.setActive(job.name);
  }

  @OnWorkerEvent('failed')
  protected async onFailed(job: Job<VisionJobPayload>) {
    try {
      const failedReason = (job as any).failedReason || '';
      if (failedReason.includes('canceled'))
        await this.bullMQLogger.log(job, 'canceled');
      else await this.bullMQLogger.error(job, 'failed');
    } catch (err) {
      this.logger.error('bullMQLogger failed in onFailed:', err);
    }

    const maxAttempts =
      this.bullMQConfigService.config.defaultJobOptions.attempts ?? 3;

    if (job.attemptsMade < maxAttempts) return;
    const retryDelayMs = this.bullMQConfigService.config.failedJobRetryDelayMs;

    try {
      await this.postgresService.upsert(job.name, {
        queueName: job.queueName,
        jobId: String(job.id),
        status: 'PENDING_RETRY',
        failedAt: new Date(),
        failedReason: (job as any).failedReason,
        attemptsMade: job.attemptsMade,
        nextRetryAt: new Date(Date.now() + retryDelayMs),
        payload: job.data as any,
      });
    } catch (err) {
      this.logger.error('Failed to persist DLQ record:', err);
    }

    try {
      await job.remove();
    } catch (err) {
      this.logger.error('Failed to remove dead job from BullMQ:', err);
    }

    this.jobTracking.remove(job.name);
  }
}

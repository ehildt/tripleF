import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { OllamaService } from '@ehildt/nestjs-ollama';
import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { ChatResponse, Message } from 'ollama';

import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import { FastifyMultipartDataWithFiltersReq } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { JobTrackingService } from '../services/job-tracking.service.js';

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
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async process(_job: Job<FastifyMultipartDataWithFiltersReq>) {
    throw new Error('Not implemented - override in subclass');
  }

  protected validateInput(buffers: unknown, meta: unknown): void {
    if (!Array.isArray(meta) || !meta.length) throw new Error('Missing meta');
    if (!Array.isArray(buffers) || !buffers.length)
      throw new Error('Missing buffers');
    if (buffers.length !== meta.length)
      throw new Error('buffers/meta length mismatch');
  }

  protected async handleVision(
    job: Job<FastifyMultipartDataWithFiltersReq>,
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
            // ! REVIEW
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
    filters: FastifyMultipartDataWithFiltersReq['filters'],
    systemPromptKey: SystemPromptKey,
    userMessagePrefix: string = 'Image(s):',
    variantDescriptions?: string[],
  ) {
    const systemPrompt: Message = {
      role: 'system',
      content: this.ollamaConfigService.config.systemPrompts[systemPromptKey],
    };

    // Build content with variant descriptions if preprocessing was enabled
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
      (p): p is { role: string; content: string } =>
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
    } catch (err) {
      this.logger.error(
        `Socket emit failed: roomId=${roomId}, data=${JSON.stringify(
          data,
        ).slice(0, 100)}`,
        err,
      );
    }
  }

  @OnWorkerEvent('completed')
  protected async onCompleted(job: Job<FastifyMultipartDataWithFiltersReq>) {
    try {
      await this.bullMQLogger.log(job);
    } catch (err) {
      this.logger.error('bullMQLogger.log failed in onCompleted:', err);
    }
    this.jobTracking.remove(job.name);
  }

  @OnWorkerEvent('active')
  protected async onActive(job: Job<FastifyMultipartDataWithFiltersReq>) {
    try {
      await this.bullMQLogger.log(job);
    } catch (err) {
      this.logger.error('bullMQLogger.log failed in onActive:', err);
    }
    this.jobTracking.setActive(job.name);
  }

  @OnWorkerEvent('failed')
  protected async onFailed(job: Job<FastifyMultipartDataWithFiltersReq>) {
    try {
      const failedReason = (job as any).failedReason || '';
      if (failedReason.includes('canceled'))
        await this.bullMQLogger.log(job, 'canceled');
      else await this.bullMQLogger.error(job);
    } catch (err) {
      this.logger.error('bullMQLogger failed in onFailed:', err);
    }
    this.jobTracking.remove(job.name);
  }
}

import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Inject, Injectable, Logger } from '@nestjs/common';

import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import { ThinkMode } from '../../ai-sdk/helpers/ollama.helpers.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import {
  buildGalleryItems,
  emitToSocket,
  extractImageCountFromToolResults,
  extractVideoCountFromToolResults,
} from '../helpers/harness.helpers.js';

import { HarnessContext } from './harness-context.type.js';

type CompactStreamParams = {
  requestId: string;
  roomId?: string;
  event: string;
  model: string;
  messages: InputMessage[];
  keepAlive?: string;
  numCtx?: number;
  think?: ThinkMode;
  stream: boolean;
  abortSignal?: AbortSignal;
};

@Injectable()
export class HarnessChatStreamingService {
  private readonly logger = new Logger(HarnessChatStreamingService.name);
  constructor(
    @Inject(SocketIOService)
    private readonly io: SocketIOService,
    @Inject(AiSdkService)
    private readonly aiSdkService: AiSdkService,
  ) {}

  async streamResult(ctx: HarnessContext): Promise<void> {
    if (ctx.doneReason === 'clarification') {
      await emitToSocket(this.io, ctx.roomId, ctx.event, {
        requestId: ctx.requestId,
        model: ctx.model,
        template: 'text',
        delta: ctx.outputs.intent!.clarificationQuestion,
        done: true,
      });
      return;
    }

    if (ctx.doneReason === 'error') {
      await emitToSocket(this.io, ctx.roomId, ctx.event, {
        requestId: ctx.requestId,
        model: ctx.model,
        template: 'text',
        delta: ctx.error || 'An unexpected error occurred',
        error: ctx.error,
        done: true,
      });
      return;
    }

    if (!ctx.outputs.finalContent) {
      await emitToSocket(this.io, ctx.roomId, ctx.event, {
        requestId: ctx.requestId,
        model: ctx.model,
        template: 'text',
        delta:
          ctx.outputs.finalContent === undefined
            ? 'No response content produced'
            : 'The model returned an empty response',
        error:
          ctx.outputs.finalContent === undefined
            ? 'No response content produced'
            : 'The model returned an empty response',
        done: true,
      });
      return;
    }

    const originalMeta = ctx.processedMeta.filter(
      (entry) => !entry.variant || entry.variant === 'original',
    );

    const images = ctx.hasNewImages
      ? buildGalleryItems(
          ctx.sessionId,
          ctx.filters.conversationId,
          originalMeta,
        )
      : [];
    const template = ctx.outputs.intent?.template ?? 'text';

    this.logger.log('[HARNESS] stream result', {
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      hasNewImages: ctx.hasNewImages,
      template,
      imageCount: ctx.processedMeta.length,
      originalImageCount: originalMeta.length,
      galleryItemCount: images.length,
      availableImageCount: extractImageCountFromToolResults(
        ctx.outputs.toolResults,
      ),
      availableVideoCount: extractVideoCountFromToolResults(
        ctx.outputs.toolResults,
      ),
    });

    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template,
      delta: ctx.stream ? '' : ctx.outputs.finalContent,
      images,
      toolResults: ctx.outputs.toolResults,
      meta: ctx.hasNewImages ? originalMeta : undefined,
      prompt: ctx.lastUserPrompt,
      promptEvalCount: ctx.outputs.inputTokens,
      evalCount: ctx.outputs.outputTokens,
      done: true,
    });
  }

  async streamCompact(params: CompactStreamParams): Promise<void> {
    const {
      requestId,
      roomId,
      event,
      model,
      messages,
      keepAlive,
      numCtx,
      think,
      stream,
      abortSignal,
    } = params;

    await emitToSocket(this.io, roomId, event, {
      requestId,
      compact: true,
      status: 'compacting',
    });

    if (stream) {
      const { fullStream } = await this.aiSdkService.streamChat({
        model,
        messages,
        keepAlive,
        numCtx,
        think,
        abortSignal,
      });

      let fullContent = '';

      for await (const part of fullStream) {
        if (part.type === 'text-delta' && part.text) {
          fullContent += part.text;
          await emitToSocket(this.io, roomId, event, {
            requestId,
            compact: true,
            message: { role: 'assistant', content: part.text },
            done: false,
          });
        }
      }

      if (fullContent) {
        await emitToSocket(this.io, roomId, event, {
          requestId,
          compact: true,
          message: { role: 'assistant', content: fullContent },
          done: true,
        });
      }
    } else {
      const { text } = await this.aiSdkService.generateChat({
        model,
        messages,
        keepAlive,
        numCtx,
        think,
        abortSignal,
      });

      await emitToSocket(this.io, roomId, event, {
        requestId,
        compact: true,
        message: { role: 'assistant', content: text },
        done: true,
      });
    }
  }
}

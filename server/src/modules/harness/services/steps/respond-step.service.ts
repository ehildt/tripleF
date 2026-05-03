import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { RespondActionService } from '../../actions/respond.action.js';
import {
  buildGalleryItems,
  emitToSocket,
} from '../../helpers/harness.helpers.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

@Injectable()
export class RespondStepService implements StepHandler {
  private readonly logger = new Logger(RespondStepService.name);

  constructor(
    @Inject(RespondActionService)
    private readonly respondAction: RespondActionService,
    @Inject(SocketIOService)
    private readonly io: SocketIOService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent)
      throw new Error('Missing interpret output — respond cannot run');

    const originalMeta = ctx.processedMeta.filter(
      (entry) => !entry.variant || entry.variant === 'original',
    );

    const galleryItems = ctx.hasNewImages
      ? buildGalleryItems(
          ctx.sessionId,
          ctx.filters.conversationId,
          originalMeta,
        )
      : [];

    this.logger.log('[HARNESS] respond step', {
      requestId: ctx.requestId,
      hasNewImages: ctx.hasNewImages,
      galleryItemCount: galleryItems.length,
      imageCount: ctx.processedMeta.length,
      originalImageCount: originalMeta.length,
    });

    const { content, inputTokens, outputTokens } =
      await this.respondAction.execute({
        intent: ctx.outputs.intent,
        messages: ctx.request.messages,
        model: ctx.model,
        keepAlive: ctx.request.keep_alive,
        numCtx: ctx.request.options?.num_ctx,
        think: ctx.request.think,
        stream: ctx.stream,
        abortSignal: ctx.abortSignal,
        onTextDelta: ctx.stream
          ? (delta) => this.emitStreamDelta(ctx, delta, galleryItems)
          : undefined,
      });

    ctx.outputs.finalContent = content;
    ctx.outputs.inputTokens = inputTokens;
    ctx.outputs.outputTokens = outputTokens;

    this.logger.log('[HARNESS]', {
      step: 'respond',
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent.template,
      inputTokens,
      outputTokens,
      length: content.length,
      contentPreview: content.slice(0, 500),
      parsedHeroImageUrl: this.extractHeroImageUrl(content),
      parsedHeroVideoUrl: this.extractHeroVideoUrl(content),
      parsedGalleryItemCount: this.extractGalleryItemCount(content),
      parsedVideoGalleryItemCount: this.extractVideoGalleryItemCount(content),
    });
  }

  private extractHeroImageUrl(content: string): string | null {
    try {
      // cleaned content should not be repeatedly parsed
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      return typeof parsed.heroImageUrl === 'string'
        ? parsed.heroImageUrl
        : null;
    } catch {
      return null;
    }
  }

  private extractGalleryItemCount(content: string): number | null {
    try {
      // cleaned content should not be repeatedly parsed
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      return Array.isArray(parsed.galleryItems)
        ? parsed.galleryItems.length
        : null;
    } catch {
      return null;
    }
  }

  private extractHeroVideoUrl(content: string): string | null {
    try {
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      return typeof parsed.heroVideoUrl === 'string'
        ? parsed.heroVideoUrl
        : null;
    } catch {
      return null;
    }
  }

  private extractVideoGalleryItemCount(content: string): number | null {
    try {
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      return Array.isArray(parsed.videoGalleryItems)
        ? parsed.videoGalleryItems.length
        : null;
    } catch {
      return null;
    }
  }

  private async emitStreamDelta(
    ctx: HarnessContext,
    delta: string,
    galleryItems: Array<Record<string, string>>,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      delta,
      images: galleryItems,
      done: false,
    });
  }
}

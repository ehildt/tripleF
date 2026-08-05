import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import {
  SanitizeActionService,
  type SanitizeResult,
} from '../../actions/sanitize.action.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../../helpers/extract-media-from-tools.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';

@Injectable()
export class SanitizeStepService implements StepHandler {
  constructor(
    private readonly sanitizeAction: SanitizeActionService,
    private readonly io: SocketIOService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent) {
      throw new Error('Missing interpret output — sanitize cannot run');
    }

    // Only announce link verification when there are results to verify.
    if (ctx.outputs.toolResults.length > 0) {
      await this.emitStatus(ctx, 'Verifying links and cleaning up results…');
    }

    const result = await this.sanitizeAction.execute(
      ctx,
      ctx.outputs.toolResults,
      ctx.buffers,
    );

    ctx.outputs.toolResults = result.toolResults;
    ctx.outputs.ingestedForRewrite = result.ingestedForRewrite;
    ctx.outputs.availableImages = result.availableImages;
    ctx.outputs.availableVideos = result.availableVideos;
    ctx.request.messages = result.messages;
    this.appendIngestedMeta(ctx, result.ingestedImages);

    this.stepLogger.log(ctx, 'sanitize', 'results sanitized', {
      model: ctx.model,
      toolCount: result.toolResults.length,
      availableImageCount: result.availableImageCount,
      ingestedImageCount: result.ingestedImages?.length ?? 0,
      availableVideoCount: result.availableVideoCount,
      sampleImageUrls: result.toolResults
        .flatMap((tr) => extractImageSearchItems([tr]))
        .slice(0, 3)
        .map((i) => i.imageUrl),
      sampleVideoUrls: result.toolResults
        .flatMap((tr) => extractVideoSearchItems([tr]))
        .slice(0, 3)
        .map((v) => v.videoUrl),
    });
  }

  private appendIngestedMeta(
    ctx: HarnessContext,
    ingestedImages: SanitizeResult['ingestedImages'],
  ): void {
    if (!ingestedImages?.length) return;

    ctx.processedMeta = [
      ...ctx.processedMeta,
      ...ingestedImages.map((img) => ({
        name: img.name,
        hash: img.hash,
        type: 'image/png',
        variant: 'original' as const,
        source: img.source,
      })),
    ];
  }

  private async emitStatus(
    ctx: HarnessContext,
    message: string,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      status: message,
      done: false,
    });
  }
}

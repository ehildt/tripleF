import { Injectable, Logger } from '@nestjs/common';
import { SocketIOService } from '@triplef/socketio';

import { MemoryClientService } from '../../../memory-client/services/memory-client.service.js';
import {
  SanitizeActionService,
  type SanitizeResult,
} from '../../actions/sanitize.action.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import {
  HARNESS_ACTIVITY_KEYS,
  resolveHarnessActivityLanguage,
} from '../../helpers/harness-activity.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../../helpers/media/extract-media-from-tools.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

import { mapDocumentSection } from './helpers/map-document-section.helper.js';
import { mapIngestedMeta } from './helpers/map-ingested-meta.helper.js';

@Injectable()
export class SanitizeStepService implements StepHandler {
  private readonly logger = new Logger(SanitizeStepService.name);

  constructor(
    private readonly sanitizeAction: SanitizeActionService,
    private readonly io: SocketIOService,
    private readonly memoryClient: MemoryClientService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent) {
      throw new Error('Missing interpret output — sanitize cannot run');
    }

    // Index uploaded documents into the lexicon (pure knowledge) —
    // fire-and-forget, independent of whether a web search ran this turn.
    if (ctx.documentSections?.length) {
      void this.memoryClient.indexLexiconDocuments({
        documents: ctx.documentSections.map(mapDocumentSection),
        partitionScope: ctx.memoryPartition ?? ctx.sessionId ?? 'global',
      });
    }

    // Only announce link verification when there are results to verify.
    if (ctx.outputs.toolResults.length > 0) {
      await this.emitStatus(ctx, HARNESS_ACTIVITY_KEYS.verifying);
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

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'sanitize',
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
      },
      'results sanitized',
    );
  }

  private appendIngestedMeta(
    ctx: HarnessContext,
    ingestedImages: SanitizeResult['ingestedImages'],
  ): void {
    if (!ingestedImages?.length) return;

    ctx.processedMeta = [
      ...ctx.processedMeta,
      ...ingestedImages.map(mapIngestedMeta),
    ];
  }

  private async emitStatus(ctx: HarnessContext, key: string): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      activity: { key },
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }
}

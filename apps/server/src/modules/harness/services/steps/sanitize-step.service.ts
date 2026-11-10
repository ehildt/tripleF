import { Injectable, Logger } from '@nestjs/common';
import { SocketIOService } from '@triplef/socketio';

import { MemoryEncyclopediaService } from '../../../memory-client/services/memory-encyclopedia.service.js';
import {
  SanitizeActionService,
  type SanitizeResult,
} from '../../actions/sanitize.action.js';
import {
  emitHarnessEvent,
  HARNESS_EVENT_TYPES,
} from '../../helpers/emit-harness-event.helper.js';
import {
  HARNESS_ACTIVITY_KEYS,
  resolveHarnessActivityLanguage,
} from '../../helpers/harness-activity.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../../helpers/media/extract-media-from-tools.helper.js';
import { resolveToolCategory } from '../../helpers/tools/resolve-tool-category.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

import { mapDocumentSection } from './helpers/map-document-section.helper.js';
import { mapIngestedMeta } from './helpers/map-ingested-meta.helper.js';

/** Categories whose sanitize pass checks external links or media. */
const LINK_VERIFICATION_TOOL_CATEGORIES = new Set([
  'web',
  'images',
  'videos',
  'news',
  'shopping',
  'reviews',
  'places',
  'fetch',
]);

@Injectable()
export class SanitizeStepService implements StepHandler {
  private readonly logger = new Logger(SanitizeStepService.name);

  constructor(
    private readonly sanitizeAction: SanitizeActionService,
    private readonly io: SocketIOService,
    private readonly memoryEncyclopedia: MemoryEncyclopediaService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent) {
      throw new Error('Missing interpret output — sanitize cannot run');
    }

    // Index uploaded documents into the encyclopedia (pure knowledge) —
    // fire-and-forget, independent of whether a web search ran this turn.
    if (ctx.documentSections?.length) {
      void this.memoryEncyclopedia
        .indexEncyclopediaDocuments({
          documents: ctx.documentSections.map(mapDocumentSection),
          partitionScope: ctx.memoryPartition ?? ctx.sessionId ?? 'global',
        })
        .then((outcome) => {
          if (!outcome) return;
          if (outcome.rejectedDocs?.length) {
            this.logger.warn(
              {
                requestId: ctx.requestId,
                step: 'sanitize',
                rejectedDocs: outcome.rejectedDocs,
              },
              'encyclopedia index dropped oversized/empty uploads',
            );
          }
          this.logger.log(
            {
              requestId: ctx.requestId,
              step: 'sanitize',
              storedDocs: outcome.storedDocs,
              reusedDocs: outcome.reusedDocs,
            },
            'encyclopedia documents indexed',
          );
        });
    }

    const status = this.resolveSanitizeStatus(ctx);
    if (status) await this.emitStatus(ctx, status);

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

  private resolveSanitizeStatus(ctx: HarnessContext): string | undefined {
    if (ctx.outputs.toolResults.length === 0) return undefined;

    const hasLinksOrMedia = ctx.outputs.toolResults.some((result) =>
      LINK_VERIFICATION_TOOL_CATEGORIES.has(
        resolveToolCategory(result.toolName),
      ),
    );
    return hasLinksOrMedia
      ? HARNESS_ACTIVITY_KEYS.verifying
      : HARNESS_ACTIVITY_KEYS.reviewingResults;
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
    await emitHarnessEvent(
      this.io,
      ctx.event,
      ctx.roomId,
      ctx.requestId,
      HARNESS_EVENT_TYPES.activity,
      {
        template: ctx.outputs.intent?.template,
        key,
        language: resolveHarnessActivityLanguage(ctx),
      },
    );
  }
}

import { Injectable } from '@nestjs/common';
import type { ToolResult } from '@triplef/ai-sdk';

import { buildFinalMessagesForSanitize } from '../helpers/sanitize/build-final-messages.helper.js';
import { scrubBrokenUrlsFromMessages } from '../helpers/sanitize/scrub-broken-urls-from-messages.helper.js';
import { CognitionContextService } from '../services/cognition-context.service.js';
import type { HarnessContext } from '../services/harness-context.type.js';
import { MediaSanitizationService } from '../services/media-sanitization.service.js';
import { SourceContextService } from '../services/source-context.service.js';

import { mapImageToAvailable } from './helpers/map-image-to-available.helper.js';
import { mapVideoToAvailable } from './helpers/map-video-to-available.helper.js';
import type { SanitizeResult } from './sanitize.action.types.js';

/** Coordinates the sanitize pipeline; domain decisions live in its services. */
@Injectable()
export class SanitizeActionService {
  constructor(
    private readonly mediaSanitization: MediaSanitizationService,
    private readonly sourceContext: SourceContextService,
    private readonly cognitionContext: CognitionContextService,
  ) {}

  /** Build sanitized tool results, response messages, and client-visible media. */
  async execute(
    ctx: HarnessContext,
    toolResults: ToolResult[],
    buffers: Buffer[],
  ): Promise<SanitizeResult> {
    const media = await this.mediaSanitization.sanitize(ctx, toolResults);
    const sources = await this.sourceContext.buildContext(
      ctx,
      media.toolResults,
      media.images,
      media.videos,
    );
    const cognition = await this.cognitionContext.buildContext(ctx);

    const messages = scrubBrokenUrlsFromMessages(
      buildFinalMessagesForSanitize(
        ctx,
        buffers,
        media.toolResults,
        sources.images,
        sources.videos,
        sources.articles,
        sources.references,
        sources.referencesSelection,
        sources.encyclopediaPassages,
        sources.shopOffers,
        sources.reviews,
        sources.places,
        sources.internationalArticles,
        sources.internationalVideos,
        cognition.profile,
        cognition.persona,
        cognition.corrections,
        cognition.insights,
        cognition.convictions,
        cognition.episodes,
        cognition.clusters,
      ),
      new Set([...media.brokenMediaUrls, ...media.brokenPageUrls]),
    );

    return {
      toolResults: media.toolResults,
      messages,
      availableImageCount: sources.images.length,
      availableVideoCount: sources.videos.length,
      ingestedImages: media.ingestedImages,
      ingestedForRewrite: media.ingestedForRewrite,
      // The client fallback uses the exact deduplicated set shown to the
      // model, so previously shown media is never re-displayed.
      availableImages: sources.images.map(mapImageToAvailable),
      availableVideos: sources.videos.map(mapVideoToAvailable),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';

import type { FingerprintedImageItem } from '../../helpers/media/dedupe-images-by-fingerprint.types.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../../helpers/media/extract-media-from-tools.types.js';
import { isShownImage } from '../../helpers/media/is-shown-image.helper.js';
import { isShownVideo } from '../../helpers/media/is-shown-video.helper.js';
import { collectHistoryImageUrls } from '../../helpers/sanitize/collect-history-image-urls.helper.js';
import { collectHistoryVideoUrls } from '../../helpers/sanitize/collect-history-video-urls.helper.js';
import { videoUrlKeys } from '../../helpers/url-trust/video-url-keys.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { ShownMediaService } from '../shown-media.service.js';
import type { ShownMediaKeys } from '../shown-media.service.types.js';

import type { SanitizeImageIngestionResult } from './image-ingestion.service.types.js';

/** Removes previously rendered media from media-list follow-up responses. */
@Injectable()
export class SanitizeShownMediaFilterService {
  private readonly logger = new Logger(SanitizeShownMediaFilterService.name);

  constructor(private readonly shownMedia: ShownMediaService) {}

  /** Load the registry once for image/video-list follow-ups only. */
  async lookupShownKeys(
    ctx: HarnessContext,
    template: string | undefined,
  ): Promise<ShownMediaKeys | undefined> {
    if (template !== 'imagelist' && template !== 'videolist') {
      return undefined;
    }
    return this.shownMedia.lookupKeys(
      ctx.sessionId,
      ctx.filters.conversationId,
    );
  }

  /** Drop shown images before ingestion so repeats are not downloaded again. */
  filterImageCandidates(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    dedupedImages: FingerprintedImageItem[],
  ): ExtractedImageItem[] {
    const fresh =
      template === 'imagelist' && shownKeys
        ? dedupedImages.filter(
            ({ fingerprint }) => !isShownImage(shownKeys, { fingerprint }),
          )
        : dedupedImages;

    const removedCount = dedupedImages.length - fresh.length;
    if (removedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedCount,
          remainingCount: fresh.length,
        },
        'skipped previously shown images',
      );
    }

    return fresh.map(({ item }) => item);
  }

  /** Drop videos matched by either the registry or legacy history markers. */
  filterVideoCandidates(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    videos: ExtractedVideoItem[],
  ): ExtractedVideoItem[] {
    if (template !== 'videolist') return videos;

    const historyVideoUrls = collectHistoryVideoUrls(ctx.request.messages);
    if (historyVideoUrls.size === 0 && !shownKeys) return videos;

    const fresh = videos.filter((video) => {
      if (
        videoUrlKeys(video.videoUrl).some((key) => historyVideoUrls.has(key))
      ) {
        return false;
      }
      return !shownKeys || !isShownVideo(shownKeys, video.videoUrl);
    });

    const removedCount = videos.length - fresh.length;
    if (removedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedCount,
          remainingCount: fresh.length,
        },
        'skipped previously shown videos',
      );
    }

    return fresh;
  }

  /**
   * Drop ingested images matched by registry fingerprint/storage hash or
   * legacy history URLs, and remove them from the URL-rewrite set as well.
   */
  filterIngestedImages(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    ingestion: SanitizeImageIngestionResult,
  ): SanitizeImageIngestionResult {
    if (template !== 'imagelist' || ingestion.ingestedForRewrite.length === 0) {
      return ingestion;
    }

    const legacyImageUrls = collectHistoryImageUrls(ctx.request.messages);
    if (!shownKeys && legacyImageUrls.size === 0) return ingestion;

    const droppedFinalUrls = new Set<string>();
    const freshForRewrite = ingestion.ingestedForRewrite.filter((entry) => {
      const shown =
        (shownKeys !== undefined &&
          isShownImage(shownKeys, {
            fingerprint: entry.fingerprint,
            storageUrl: entry.imageUrl,
          })) ||
        legacyImageUrls.has(entry.imageUrl);
      if (shown) droppedFinalUrls.add(entry.imageUrl);
      return !shown;
    });

    if (droppedFinalUrls.size === 0) return ingestion;

    const verifiedImages = ingestion.verifiedImages.filter(
      (item) => !droppedFinalUrls.has(item.imageUrl),
    );

    const removedCount =
      ingestion.verifiedImages.length - verifiedImages.length;
    if (removedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedCount,
          remainingCount: verifiedImages.length,
        },
        'skipped previously shown images',
      );
    }

    return {
      ...ingestion,
      verifiedImages,
      ingestedForRewrite: freshForRewrite,
    };
  }
}

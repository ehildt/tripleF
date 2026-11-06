import { Injectable, Logger } from '@nestjs/common';

import { SharpService } from '../../../sharp/services/sharp.service.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../../helpers/media/extract-media-from-tools.types.js';
import type { ImageUrlEntry } from '../../helpers/sanitize/collect-image-urls.helper.js';
import { filterVerifiedMedia } from '../../helpers/sanitize/filter-verified-media.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { MediaUrlValidatorService } from '../media-url-validator.service.js';

import type {
  SanitizeBrokenUrls,
  SanitizeVerifiedMedia,
} from './media-validation.service.types.js';

/** Applies sanitize-specific URL and media verification policies. */
@Injectable()
export class SanitizeMediaValidationService {
  private readonly logger = new Logger(SanitizeMediaValidationService.name);

  constructor(
    private readonly mediaUrlValidator: MediaUrlValidatorService,
    private readonly sharpService: SharpService,
  ) {}

  /** Verify image/video candidates, including the configured image-size floor. */
  async verifyMedia(
    rawImages: ExtractedImageItem[],
    rawVideos: ExtractedVideoItem[],
  ): Promise<SanitizeVerifiedMedia> {
    return filterVerifiedMedia(
      this.mediaUrlValidator,
      rawImages,
      rawVideos,
      this.sharpService.effectiveResize(),
    );
  }

  /** Probe image, thumbnail, and page URL pools concurrently. */
  async findBrokenUrls(
    ctx: HarnessContext,
    imageEntries: ImageUrlEntry[],
    thumbnailUrls: string[],
    pageUrls: string[],
  ): Promise<SanitizeBrokenUrls> {
    const [imageUrls, brokenThumbnailUrls, brokenPageUrls] = await Promise.all([
      this.findBrokenImageUrls(ctx, imageEntries),
      this.findBrokenThumbnailUrls(ctx, thumbnailUrls),
      this.findBrokenPageUrls(ctx, pageUrls),
    ]);

    return {
      mediaUrls: new Set([...imageUrls, ...brokenThumbnailUrls]),
      pageUrls: brokenPageUrls,
    };
  }

  private async findBrokenImageUrls(
    ctx: HarnessContext,
    entries: ImageUrlEntry[],
  ): Promise<Set<string>> {
    if (entries.length === 0) return new Set();

    // Strict entries must meet the effective preprocessing dimensions;
    // trusted provider-filtered images only need to be real and reachable.
    const strictUrls = entries
      .filter((entry) => !entry.skipDimensionCheck)
      .map((entry) => entry.url);
    const skipDimUrls = entries
      .filter((entry) => entry.skipDimensionCheck)
      .map((entry) => entry.url);
    const resizeFloor = this.sharpService.effectiveResize();

    const [strictResults, skipDimResults] = await Promise.all([
      strictUrls.length > 0
        ? this.mediaUrlValidator.validateUrls(strictUrls, {
            enabled: true,
            timeoutMs: 5000,
            maxRedirects: 3,
            concurrency: 5,
            checkImageDimensions: true,
            minWidth: resizeFloor.maxWidth,
            minHeight: resizeFloor.maxHeight ?? undefined,
            maxProbeBytes: 256 * 1024,
          })
        : Promise.resolve([]),
      skipDimUrls.length > 0
        ? this.mediaUrlValidator.validateUrls(skipDimUrls, {
            enabled: true,
            timeoutMs: 5000,
            maxRedirects: 3,
            concurrency: 5,
            checkImageDimensions: false,
          })
        : Promise.resolve([]),
    ]);

    const broken = [
      ...strictResults.filter((result) => result.kind !== 'image'),
      ...skipDimResults.filter((result) => result.kind !== 'image'),
    ].map((result) => result.url);

    if (broken.length > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
        'removed broken or undersized image urls',
      );
    }

    return new Set(broken);
  }

  /** Thumbnails only need to serve an image; their display size is small. */
  private async findBrokenThumbnailUrls(
    ctx: HarnessContext,
    urls: string[],
  ): Promise<Set<string>> {
    if (urls.length === 0) return new Set();

    const results = await this.mediaUrlValidator.validateUrls(urls, {
      enabled: true,
      timeoutMs: 3000,
      maxRedirects: 3,
      concurrency: 5,
    });

    const broken = results
      .filter((result) => result.kind !== 'image')
      .map((result) => result.url);

    if (broken.length > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
        'removed broken video thumbnails',
      );
    }

    return new Set(broken);
  }

  /** Unknown page probes stay; only definitive failures remove citations. */
  private async findBrokenPageUrls(
    ctx: HarnessContext,
    urls: string[],
  ): Promise<Set<string>> {
    if (urls.length === 0) return new Set();

    const results = await this.mediaUrlValidator.validateUrls(urls, {
      enabled: true,
      timeoutMs: 3000,
      maxRedirects: 3,
      concurrency: 5,
    });

    const broken = results
      .filter((result) => result.kind === 'broken')
      .map((result) => result.url);

    if (broken.length > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
        'removed dead article page urls',
      );
    }

    return new Set(broken);
  }
}

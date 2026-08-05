import type { MediaUrlValidatorService } from '../../services/media-url-validator.service.js';
import type { MediaValidationResult } from '../../services/media-url-validator.service.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../extract-media-from-tools.helper.js';

/**
 * Verify media URLs against live endpoints. Broken links are dropped; type
 * mismatches (image URL actually pointing to a video or vice versa) are
 * re-routed. Images flagged `skipDimensionCheck` (e.g. Bright Data, which we
 * trust the Google-side size filter for) are confirmed to be real reachable
 * images but are not held to the 1280×720 floor.
 */
export async function filterVerifiedMedia(
  mediaUrlValidator: MediaUrlValidatorService,
  rawImages: ExtractedImageItem[],
  rawVideos: ExtractedVideoItem[],
): Promise<{
  images: ExtractedImageItem[];
  videos: ExtractedVideoItem[];
}> {
  const strictImages = rawImages.filter((item) => !item.skipDimensionCheck);
  const skipDimImages = rawImages.filter((item) => item.skipDimensionCheck);
  const videoUrls = rawVideos.map((item) => item.videoUrl);

  const [strictImageResults, skipDimImageResults, videoResults] =
    await Promise.all([
      mediaUrlValidator.validateUrls(
        strictImages.map((item) => item.imageUrl),
        {
          enabled: true,
          timeoutMs: 5000,
          maxRedirects: 3,
          concurrency: 5,
          checkImageDimensions: true,
          minWidth: 1280,
          minHeight: 720,
          maxProbeBytes: 256 * 1024,
        },
      ),
      mediaUrlValidator.validateUrls(
        skipDimImages.map((item) => item.imageUrl),
        {
          enabled: true,
          timeoutMs: 5000,
          maxRedirects: 3,
          concurrency: 5,
          checkImageDimensions: false,
        },
      ),
      mediaUrlValidator.validateUrls(videoUrls, {
        enabled: true,
        timeoutMs: 3000,
        maxRedirects: 3,
        concurrency: 5,
      }),
    ]);

  const imageResultByUrl = new Map<string, MediaValidationResult>();
  for (const result of [...strictImageResults, ...skipDimImageResults]) {
    imageResultByUrl.set(result.url, result);
  }

  const images: ExtractedImageItem[] = [];
  const videos: ExtractedVideoItem[] = [];

  for (const item of rawImages) {
    const result = imageResultByUrl.get(item.imageUrl);
    if (
      !result ||
      result.kind === 'broken' ||
      result.kind === 'unknown' ||
      result.kind === 'html'
    )
      continue;

    if (result.kind === 'video')
      videos.push({ videoUrl: item.imageUrl, title: item.title });
    else images.push(item);
  }

  for (let i = 0; i < rawVideos.length; i++) {
    const item = rawVideos[i];
    const result = videoResults[i];
    if (
      !result ||
      result.kind === 'broken' ||
      result.kind === 'unknown' ||
      result.kind === 'html'
    )
      continue;

    if (result.kind === 'image')
      images.push({ imageUrl: item.videoUrl, title: item.title });
    else videos.push(item);
  }

  return { images, videos };
}

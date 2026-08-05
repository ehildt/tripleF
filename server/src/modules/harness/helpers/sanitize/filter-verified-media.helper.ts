import type { MediaUrlValidatorService } from '../../services/media-url-validator.service.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../extract-media-from-tools.helper.js';

/**
 * Verify media URLs against live endpoints. Broken links are dropped; type
 * mismatches (image URL actually pointing to a video or vice versa) are
 * re-routed.
 */
export async function filterVerifiedMedia(
  mediaUrlValidator: MediaUrlValidatorService,
  rawImages: ExtractedImageItem[],
  rawVideos: ExtractedVideoItem[],
): Promise<{
  images: ExtractedImageItem[];
  videos: ExtractedVideoItem[];
}> {
  const imageUrls = rawImages.map((item) => item.imageUrl);
  const videoUrls = rawVideos.map((item) => item.videoUrl);

  const [imageResults, videoResults] = await Promise.all([
    mediaUrlValidator.validateUrls(imageUrls, {
      enabled: true,
      timeoutMs: 5000,
      maxRedirects: 3,
      concurrency: 5,
      checkImageDimensions: true,
      minWidth: 1280,
      minHeight: 720,
      maxProbeBytes: 256 * 1024,
    }),
    mediaUrlValidator.validateUrls(videoUrls, {
      enabled: true,
      timeoutMs: 3000,
      maxRedirects: 3,
      concurrency: 5,
    }),
  ]);

  const images: ExtractedImageItem[] = [];
  const videos: ExtractedVideoItem[] = [];

  for (let i = 0; i < rawImages.length; i++) {
    const item = rawImages[i];
    const result = imageResults[i];
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

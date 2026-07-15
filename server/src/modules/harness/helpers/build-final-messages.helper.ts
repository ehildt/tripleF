import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { HarnessContext } from '../services/harness-context.type.js';

import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from './extract-media-from-tools.helper.js';
import type { ExtractedPlace } from './extract-places.helper.js';
import type { ExtractedReview } from './extract-reviews.helper.js';
import type { ExtractedShopOffer } from './extract-shop-offers.helper.js';

function dedupeImages<T extends { imageUrl: string }>(images: T[]): T[] {
  const seen = new Set<string>();
  return images.filter((item) => {
    if (seen.has(item.imageUrl)) return false;
    seen.add(item.imageUrl);
    return true;
  });
}

/**
 * Build final messages for the response step.
 * Prepares system + conversation messages and appends a tool-context message when
 * there are articles, verified media, or references to pass along.
 */
export function buildFinalMessagesForRespond(
  ctx: HarnessContext,
  buffers: Buffer[],
  toolResults: Array<{ toolName: string; result: unknown }>,
  verifiedImages: ExtractedImageItem[],
  verifiedVideos: ExtractedVideoItem[],
  extractedArticles: Array<Record<string, unknown>>,
  extractedReferences: unknown[],
): InputMessage[] {
  const conversation = ctx.request.messages.filter((m) => m.role !== 'system');

  if (buffers.length > 0) {
    const lastUserIndex = conversation.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex >= 0) {
      const original = conversation[lastUserIndex];
      conversation[lastUserIndex] = {
        ...original,
        images: buffers,
      };
    } else {
      conversation.push({ role: 'user', content: '', images: buffers });
    }
  }

  const systemMessages = ctx.request.messages.filter(
    (m) => m.role === 'system',
  );

  if (toolResults.length === 0) {
    return [...systemMessages, ...conversation];
  }

  const imageCount = verifiedImages.length;
  const videoCount = verifiedVideos.length;
  const intent = ctx.outputs.intent;
  const imageTargetCount = intent?.imageCount ?? 6;
  const videoTargetCount = intent?.videoCount ?? 6;
  const uniqueImages = dedupeImages(verifiedImages);

  const toolContextMessage: InputMessage = {
    role: 'system',
    content: `[TOOL CONTEXT — DO NOT OUTPUT]\n${JSON.stringify(
      {
        availableImages: uniqueImages,
        availableVideos: verifiedVideos,
        articles: extractedArticles,
        references: extractedReferences,
        imageTargetCount,
        videoTargetCount,
        imageCount,
        videoCount,
      },
      null,
      2,
    )}`,
  };

  return [...systemMessages, toolContextMessage, ...conversation];
}

/**
 * Media usage instructions injected into the tool context. Media-only list
 * templates (imagelist/videolist) have no hero media, so they get dedicated
 * instructions instead of the hero-oriented default.
 */
function buildMediaInstructions(
  template: string | undefined,
  imageCount: number,
  videoCount: number,
  imageTargetCount: number,
  videoTargetCount: number,
): string[] {
  if (template === 'imagelist') {
    return [
      `You have ${imageCount} image URL(s) in availableImages.`,
      `Put every suitable image URL into galleryItems (at most ${imageTargetCount}). This template has NO hero image — every image lives in galleryItems.`,
      'You MUST use these exact URLs in the response JSON. Do not ignore them.',
      'Each galleryItems entry must be an object with imageUrl, imageAlt, title, and caption. imageAlt and title must be non-empty.',
      'Copy width, height, and source from the availableImages entries into each galleryItems entry.',
      'If media URLs are present, leaving galleryItems empty is a failure.',
      'Never fabricate URLs — only use availableImages.',
      'IMAGE RESTRICTION: trusted sources only. No Google thumbnails, data URIs, localhost, or private IPs.',
      'MIN RESOLUTION: images must be at least 1280x720. Prefer 2560x1440.',
    ];
  }

  if (template === 'videolist') {
    return [
      `You have ${videoCount} video URL(s) in availableVideos.`,
      `Put every suitable video URL into videoGalleryItems (at most ${videoTargetCount}), ordered like a playlist. This template has NO hero video — every video lives in videoGalleryItems.`,
      'Skip any videoUrl that already appeared in an earlier videolist response in the conversation history — never return videos the user has already seen.',
      'You MUST use these exact URLs in the response JSON. Do not ignore them.',
      'Each videoGalleryItems entry must be an object with videoUrl, title, and caption. title and caption must be non-empty.',
      'Copy duration, channel, date, views, thumbnailUrl, and description from the availableVideos entries into each videoGalleryItems entry.',
      'If media URLs are present, leaving videoGalleryItems empty is a failure.',
      'Never fabricate URLs — only use availableVideos.',
      'VIDEO RESTRICTION: only YouTube, Vimeo, Dailymotion, Loom, Wistia or direct video files.',
    ];
  }

  const productInstructions =
    template === 'product'
      ? [
          'Use the shopOffers array from this context verbatim for the shopOffers field — every offer has title, price, source, and link. Sort by ascending price.',
          'Use the reviews array from this context for reviewSummary, pros, cons, and the aggregate rating. Each review has an author, a snippet, and an optional rating for a business (place).',
          'Use the places array from this context for local availability notes inside buyAdvice (store name + address + rating). Do not turn places into shopOffers — they have no prices or product links.',
          'If shopOffers is non-empty, leaving the shopOffers field empty is a failure.',
        ]
      : [];

  return [
    `You have ${imageCount} image URL(s) in availableImages and ${videoCount} video URL(s) in availableVideos.`,
    `Target counts: use at most ${imageTargetCount} image(s) and ${videoTargetCount} video(s) in the final response.`,
    'You MUST use these exact URLs in the response JSON. Do not ignore them.',
    'Pick heroImageUrl from the FIRST availableImages entry when no video is available; pick heroVideoUrl from the FIRST availableVideos entry.',
    'Take the next image URLs from availableImages for galleryItems (skip hero image URL). Do not exceed imageTargetCount.',
    `Take the next video URLs from availableVideos for videoGalleryItems. Do not exceed videoTargetCount.`,
    'If fewer URLs are available than target, include all of them.',
    'Prefer video URLs discovered inside webSearch article results first, then URLs from videoSearch.',
    'Each galleryItems entry must be an object with imageUrl, imageAlt, title, and caption.',
    'Each videoGalleryItems entry must be an object with videoUrl, title, and caption.',
    'If media URLs are present, leaving gallery or hero fields empty is a failure.',
    'IMPORTANT: videos and images are INDEPENDENT. Using videos does NOT reduce the number of images to return.',
    'Use articles for facts and sources. Never fabricate URLs — only use availableImages/availableVideos.',
    'VIDEO RESTRICTION: only YouTube, Vimeo, Dailymotion, Loom, Wistia or direct video files.',
    'IMAGE RESTRICTION: trusted sources only. No Google thumbnails, data URIs, localhost, or private IPs.',
    'MIN RESOLUTION: images must be at least 1280x720. Prefer 2560x1440.',
    ...productInstructions,
  ];
}

/**
 * Build final messages for the sanitize step — includes full text instructions.
 */
export function buildFinalMessagesForSanitize(
  ctx: HarnessContext,
  buffers: Buffer[],
  toolResults: Array<{ toolName: string; result: unknown }>,
  verifiedImages: ExtractedImageItem[],
  verifiedVideos: ExtractedVideoItem[],
  extractedArticles: Array<Record<string, unknown>>,
  extractedReferences: unknown[],
  extractedShopOffers: ExtractedShopOffer[] = [],
  extractedReviews: ExtractedReview[] = [],
  extractedPlaces: ExtractedPlace[] = [],
): InputMessage[] {
  const conversation = ctx.request.messages.filter((m) => m.role !== 'system');

  if (buffers.length > 0) {
    const lastUserIndex = conversation.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex >= 0) {
      const original = conversation[lastUserIndex];
      conversation[lastUserIndex] = {
        ...original,
        images: buffers,
      };
    } else {
      conversation.push({ role: 'user', content: '', images: buffers });
    }
  }

  const systemMessages = ctx.request.messages.filter(
    (m) => m.role === 'system',
  );

  if (toolResults.length === 0) {
    return [...systemMessages, ...conversation];
  }

  const imageCount = verifiedImages.length;
  const videoCount = verifiedVideos.length;
  const intent = ctx.outputs.intent;
  const imageTargetCount = intent?.imageCount > 0 ? intent.imageCount : 6;
  const videoTargetCount = intent?.videoCount > 0 ? intent.videoCount : 6;
  const uniqueImages = dedupeImages(verifiedImages);

  const mediaInstructions = buildMediaInstructions(
    intent?.template,
    imageCount,
    videoCount,
    imageTargetCount,
    videoTargetCount,
  );

  const toolContextMessage: InputMessage = {
    role: 'system',
    content: `[TOOL CONTEXT — DO NOT OUTPUT]\n${JSON.stringify(
      {
        availableImages: uniqueImages,
        availableVideos: verifiedVideos,
        articles: extractedArticles,
        references: extractedReferences,
        shopOffers: extractedShopOffers,
        reviews: extractedReviews,
        places: extractedPlaces,
        imageTargetCount,
        videoTargetCount,
        mediaInstructions,
      },
      null,
      2,
    )}`,
  };

  return [...systemMessages, toolContextMessage, ...conversation];
}

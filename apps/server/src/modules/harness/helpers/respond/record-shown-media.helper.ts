import type { HarnessContext } from '../../services/harness-context.type.js';
import type { HarnessStepLogger } from '../../services/harness-step-logger.service.js';
import type { ShownMediaService } from '../../services/shown-media.service.js';
import type { GalleryItem } from '../media/build-gallery-items.helper.js';

/**
 * Persist the media this response rendered so the next media-list follow-up
 * in this conversation can skip it. Recording is best-effort: a failure
 * degrades to a possible repeat, never to a failed job.
 */
export async function recordShownMedia(
  ctx: HarnessContext,
  data: Record<string, unknown> | undefined,
  galleryItems: GalleryItem[],
  shownMedia: ShownMediaService,
  stepLogger: HarnessStepLogger,
): Promise<void> {
  if (!data) return;

  const localImageUrls = new Set(
    galleryItems
      .filter((item) => item.source === 'local')
      .map((item) => item.imageUrl),
  );
  const fingerprintByStorageUrl = new Map(
    (ctx.outputs.ingestedForRewrite ?? []).map((img) => [
      img.imageUrl,
      img.fingerprint,
    ]),
  );

  try {
    const recordedCount = await shownMedia.recordShownMedia({
      sessionId: ctx.sessionId,
      conversationId: ctx.filters.conversationId,
      requestId: ctx.requestId,
      data,
      sources: { localImageUrls, fingerprintByStorageUrl },
    });

    if (recordedCount > 0) {
      stepLogger.log(ctx, 'respond', 'shown media recorded', {
        recordedCount,
      });
    }
  } catch (error) {
    stepLogger.warn(ctx, 'respond', 'shown media recording failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

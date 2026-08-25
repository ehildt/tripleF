import type { HarnessContext } from '../../services/harness-context.type.js';
import type { ShownMediaService } from '../../services/shown-media.service.js';
import type { GalleryItem } from '../media/build-gallery-items.helper.js';

interface RecordShownMediaResult {
  recordedCount: number;
  error?: Error;
}

/**
 * Persist the media this response rendered so the next media-list follow-up
 * in this conversation can skip it. Recording is best-effort: a failure
 * degrades to a possible repeat, never to a failed job — the caller logs the
 * outcome.
 */
export async function recordShownMedia(
  ctx: HarnessContext,
  data: Record<string, unknown> | undefined,
  galleryItems: GalleryItem[],
  shownMedia: ShownMediaService,
): Promise<RecordShownMediaResult> {
  if (!data) return { recordedCount: 0 };

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
    return { recordedCount };
  } catch (error) {
    return {
      recordedCount: 0,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

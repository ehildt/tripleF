import { Injectable } from '@nestjs/common';

import { ShownMediaKind } from '../../../generated/prisma/client.js';
import { ShownMediaRepository } from '../../persistence/services/shown-media.repository.js';
import {
  extractShownMediaKeys,
  IMAGE_FINGERPRINT_PREFIX,
  IMAGE_STORAGE_HASH_PREFIX,
  type ShownMediaKeySourceOptions,
} from '../helpers/extract-shown-media-keys.helper.js';
import { extractStorageHash } from '../helpers/extract-storage-hash.helper.js';
import { videoUrlKeys } from '../helpers/video-url-keys.helper.js';

/** Registry keys for one conversation, split for candidate matching. */
export interface ShownMediaKeys {
  /** `fp:<fingerprint>` and `sh:<storage hash>` entries. */
  images: Set<string>;
  /** Canonical video keys. */
  videos: Set<string>;
}

type RecordShownMediaParams = {
  sessionId: string | undefined;
  conversationId: string | undefined;
  requestId: string;
  data: Record<string, unknown> | undefined;
  sources: ShownMediaKeySourceOptions;
};

/**
 * Orchestrates the shown-media registry for the harness pipeline: records
 * rendered media after a response, and looks the registry up while
 * sanitizing the next request's candidates. Persisted state lives in
 * {@link ShownMediaRepository}; key derivation is pure
 * ({@link extractShownMediaKeys}).
 */
@Injectable()
export class ShownMediaService {
  constructor(private readonly repository: ShownMediaRepository) {}

  async lookupKeys(
    sessionId: string | undefined,
    conversationId: string | undefined,
  ): Promise<ShownMediaKeys | undefined> {
    if (!sessionId || !conversationId) return undefined;

    const keys = await this.repository.findKeysByConversation(
      sessionId,
      conversationId,
    );
    if (keys.size === 0) return { images: new Set(), videos: new Set() };

    return {
      images: keys.get(ShownMediaKind.Image) ?? new Set(),
      videos: keys.get(ShownMediaKind.Video) ?? new Set(),
    };
  }

  /** Record the media keys a guarded response rendered, best-effort per key. */
  async recordShownMedia(params: RecordShownMediaParams): Promise<number> {
    const { sessionId, conversationId, requestId, data, sources } = params;
    if (!sessionId || !conversationId || !data) return 0;

    const extracted = extractShownMediaKeys(data, sources);
    const entries = [
      ...extracted.imageKeys.map((mediaKey) => ({
        kind: ShownMediaKind.Image,
        mediaKey,
      })),
      ...extracted.videoKeys.map((mediaKey) => ({
        kind: ShownMediaKind.Video,
        mediaKey,
      })),
    ];
    if (entries.length === 0) return 0;

    return this.repository.recordMany(
      sessionId,
      conversationId,
      requestId,
      entries,
    );
  }
}

/**
 * Whether an image candidate was already shown: by content fingerprint
 * (pre-ingest candidates, freshly ingested images) or by storage hash
 * (references to objects ingested in earlier turns).
 */
export function isShownImage(
  keys: ShownMediaKeys,
  opts: { fingerprint?: string; storageUrl?: string },
): boolean {
  if (
    opts.fingerprint &&
    keys.images.has(IMAGE_FINGERPRINT_PREFIX + opts.fingerprint)
  ) {
    return true;
  }

  if (!opts.storageUrl) return false;
  const hash = extractStorageHash(opts.storageUrl);
  return (
    hash !== undefined && keys.images.has(IMAGE_STORAGE_HASH_PREFIX + hash)
  );
}

/** Whether a video URL matches any already-shown canonical key. */
export function isShownVideo(keys: ShownMediaKeys, videoUrl: string): boolean {
  return videoUrlKeys(videoUrl).some((key) => keys.videos.has(key));
}

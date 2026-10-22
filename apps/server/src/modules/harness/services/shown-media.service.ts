import { Injectable } from '@nestjs/common';

import { ShownMediaKind } from '../../../generated/prisma/client.js';
import { ShownMediaRepository } from '../../persistence/services/shown-media.repository.js';
import { extractShownMediaKeys } from '../helpers/media/extract-shown-media-keys.helper.js';

import { mapShownMediaKey } from './helpers/map-shown-media-key.helper.js';
import type {
  RecordShownMediaParams,
  ShownMediaKeys,
} from './shown-media.service.types.js';

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
      ...extracted.imageKeys.map((mediaKey) =>
        mapShownMediaKey(mediaKey, ShownMediaKind.Image),
      ),
      ...extracted.videoKeys.map((mediaKey) =>
        mapShownMediaKey(mediaKey, ShownMediaKind.Video),
      ),
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

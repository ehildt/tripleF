import type { ShownMediaKeySourceOptions } from '../helpers/media/extract-shown-media-keys.types.js';

/** Registry keys for one conversation, split for candidate matching. */
export interface ShownMediaKeys {
  /** `fp:<fingerprint>` and `sh:<storage hash>` entries. */
  images: Set<string>;
  /** Canonical video keys. */
  videos: Set<string>;
}

/** One record pass: the guarded response whose rendered media get remembered as shown. */
export type RecordShownMediaParams = {
  /** Partition session the registry row belongs to. */
  sessionId: string | undefined;
  /** Conversation the registry row belongs to. */
  conversationId: string | undefined;
  /** Harness turn id — traces the shown entries back to the request. */
  requestId: string;
  /** The guarded response payload (tool results embedded the media). */
  data: Record<string, unknown> | undefined;
  /** Extraction inputs: upload URLs to exclude and per-upload fingerprints. */
  sources: ShownMediaKeySourceOptions;
};

import type { ToolResult } from '@triplef/ai-sdk';

import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../helpers/media/extract-media-from-tools.types.js';

/** Sanitized tool results and verified media produced before source-policy and message assembly. */
export interface MediaSanitizationResult {
  /** Trusted tool results with dead citations removed and successfully ingested images rewritten. */
  toolResults: ToolResult[];
  /** Verified, deduplicated, fresh, and locally rewritten image candidates. */
  images: ExtractedImageItem[];
  /** Verified, fresh video candidates capped to the requested target count. */
  videos: ExtractedVideoItem[];
  /** Cloud reference images exposed as attachments for image-analysis tasks. */
  ingestedImages: IngestedImage[];
  /** All successfully ingested cloud images available for URL rewriting and shown-media recording. */
  ingestedForRewrite: IngestedImage[];
  /** Broken or un-ingestable image and thumbnail URLs removed from media context. */
  brokenMediaUrls: Set<string>;
  /** Definitively dead article/page URLs removed from citations and message history. */
  brokenPageUrls: Set<string>;
}

import type { InputMessage, ToolResult } from '@triplef/ai-sdk';

import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';

/** Model-visible media URL and optional display title shared by image and video fallbacks. */
interface AvailableMediaItem {
  /** Sanitized, model-visible media URL. */
  url: string;
  /** Optional source title shown by the client. */
  title?: string;
}

/** Final sanitized context and media produced for the respond step. */
export type SanitizeResult = {
  /** Trusted tool results with broken URLs removed and ingested media rewritten to local storage. */
  toolResults: ToolResult[];
  /** Conversation messages augmented with sanitized tool, source, and cognition context. */
  messages: InputMessage[];
  /** Number of source-policy-approved images available to the response model. */
  availableImageCount: number;
  /** Number of source-policy-approved videos available to the response model. */
  availableVideoCount: number;
  /** Cloud reference images exposed as user-visible file attachments for image-analysis tasks. */
  ingestedImages?: IngestedImage[];
  /** Every successfully ingested cloud image used to rewrite external URLs and record shown media. */
  ingestedForRewrite?: IngestedImage[];
  /** Deduplicated model-visible images the client may render without repeating previously shown media. */
  availableImages?: AvailableMediaItem[];
  /** Deduplicated model-visible videos the client may render without repeating previously shown media. */
  availableVideos?: AvailableMediaItem[];
};

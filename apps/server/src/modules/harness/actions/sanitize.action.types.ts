import type { InputMessage } from '@triplef/ai-sdk';
import type { ToolResult } from '@triplef/ai-sdk';

import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';

interface AvailableMedia {
  /** Model-visible media URL that the client may render or use as fallback. */
  url: string;
  /** Optional display title supplied by the media source. */
  title?: string;
}

export interface SanitizeResult {
  /** Tool results after trust, availability, and ingestion sanitization. */
  toolResults: ToolResult[];
  /** Final messages supplied to the respond model. */
  messages: InputMessage[];
  /** Number of images available to the response and client. */
  availableImageCount: number;
  /** Number of videos available to the response and client. */
  availableVideoCount: number;
  /** Cloud images attached as reference documents for image-analysis tasks. */
  ingestedImages?: IngestedImage[];
  /** All cloud images ingested for URL rewriting and shown-media recording. */
  ingestedForRewrite?: IngestedImage[];
  /** Deduplicated, previously-unshown images available to the client. */
  availableImages?: AvailableMedia[];
  /** Previously-unshown videos available to the client. */
  availableVideos?: AvailableMedia[];
}

import type { IngestedImage } from '../../helpers/media/download-and-ingest-images.types.js';
import type { ExtractedImageItem } from '../../helpers/media/extract-media-from-tools.types.js';

export interface SanitizeImageIngestionResult {
  /** Image candidates rewritten to their successfully ingested storage URLs. */
  verifiedImages: ExtractedImageItem[];
  /** Cloud images exposed as attachments for image-reference tasks. */
  ingestedImages: IngestedImage[];
  /** Every cloud image available for tool-result URL rewriting. */
  ingestedForRewrite: IngestedImage[];
}

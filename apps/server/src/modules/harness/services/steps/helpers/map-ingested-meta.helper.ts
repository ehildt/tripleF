import type { IngestedImage } from '../../../helpers/media/download-and-ingest-images.types.js';

/** Project an ingested image into the processed-meta shape. */
export function mapIngestedMeta(img: IngestedImage) {
  return {
    name: img.name,
    hash: img.hash,
    type: 'image/png',
    variant: 'original' as const,
    source: img.source,
  };
}

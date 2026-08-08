import type { IngestedImage } from '../media/download-and-ingest-images.types.js';

import type { DisplayIngested } from './build-ingested-by-url-map.types.js';

/** Map ingested images by their original source URL for URL rewriting. */
export function buildIngestedByUrlMap(
  ingestedImages: IngestedImage[],
): Map<string, DisplayIngested> {
  return new Map(
    (ingestedImages ?? []).map((img) => [
      img.sourceUrl,
      {
        imageUrl: img.imageUrl,
        title: img.title,
        width: img.width,
        height: img.height,
      },
    ]),
  );
}

import type { IngestedImage } from '../download-and-ingest-images.helper.js';

type DisplayIngested = {
  imageUrl: string;
  title?: string;
  width?: number;
  height?: number;
};

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

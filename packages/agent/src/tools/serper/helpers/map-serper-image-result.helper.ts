import type { SerperImageSearchResponse } from '../image-search.types.js';

type SerperImageItem = NonNullable<SerperImageSearchResponse['images']>[number];

/** Normalize a Serper image item into the image-search result shape. */
export function mapSerperImageResult(r: SerperImageItem) {
  return {
    title: r.title || '',
    imageUrl: r.imageUrl || r.image || '',
    sourcePageUrl: r.link || '',
    width: r.imageWidth ?? r.width,
    height: r.imageHeight ?? r.height,
    source: r.source || '',
    domain: r.domain || '',
  };
}

import type { BrightDataImageSearchResponse } from '../image-search.types.js';

type BrightDataImageItem = NonNullable<BrightDataImageSearchResponse['images']>[number];

/** Normalize a Bright Data image item into the image-search result shape. */
export function mapBrightDataImageResult(r: BrightDataImageItem) {
  return {
    title: r.title || '',
    // Prefer the real image URL; `image` is a base64 thumbnail data
    // URI that our trust rules reject.
    imageUrl: r.original_image || r.image_url || r.imageUrl || r.link || '',
    sourcePageUrl: r.source_link || r.link || '',
    width: r.width,
    height: r.height,
    source: r.source || '',
    domain: '',
  };
}

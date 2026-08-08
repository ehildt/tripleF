import type { IngestedImage } from '../media/download-and-ingest-images.types.js';

/** Cap the number of cloud reference images surfaced to the response model. */
export function limitCloudReferenceImages(
  ingestedImages: IngestedImage[],
  maxCloud: number,
): IngestedImage[] {
  return (ingestedImages ?? []).slice(0, maxCloud);
}

import type { IngestedImage } from '../download-and-ingest-images.helper.js';

/** Cap the number of cloud reference images surfaced to the response model. */
export function limitCloudReferenceImages(
  ingestedImages: IngestedImage[],
  maxCloud: number,
): IngestedImage[] {
  return (ingestedImages ?? []).slice(0, maxCloud);
}

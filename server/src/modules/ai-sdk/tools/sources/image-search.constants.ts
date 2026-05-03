/**
 * Minimum image dimensions for image search results.
 * 720p = 1280 × 720 pixels.
 */
export const MIN_IMAGE_WIDTH = 1280;
export const MIN_IMAGE_HEIGHT = 720;

/**
 * Checks whether an image meets the minimum dimension requirement.
 * Images with unknown dimensions are allowed through so the source API
 * is not the bottleneck; downstream consumers can still decide to skip them.
 */
export function meetsMinimumImageDimensions(
  width: number | undefined | null,
  height: number | undefined | null,
  minWidth: number = MIN_IMAGE_WIDTH,
  minHeight: number = MIN_IMAGE_HEIGHT,
): boolean {
  if (!width || !height) return true;
  return width >= minWidth && height >= minHeight;
}

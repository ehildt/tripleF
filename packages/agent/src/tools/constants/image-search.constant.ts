/**
 * Minimum image dimensions for image search results.
 * 720p = 1280 × 720 pixels.
 */
export const MIN_IMAGE_WIDTH = 1280;
export const MIN_IMAGE_HEIGHT = 720;

/**
 * Checks whether an image meets the minimum dimension requirement.
 * Images with unknown dimensions are now rejected so that low-resolution
 * thumbnails cannot slip through. Only images with known dimensions that
 * satisfy the minimum are allowed.
 */
export function meetsMinimumImageDimensions(
  width: number | undefined | null,
  height: number | undefined | null,
  minWidth: number = MIN_IMAGE_WIDTH,
  minHeight: number = MIN_IMAGE_HEIGHT,
): boolean {
  if (!width || !height) return false;
  return width >= minWidth && height >= minHeight;
}

import type { IngestedReplacement } from '../sanitize-tool-result.helper.types.js';

/** Replace an item's image URL with its ingested local-storage replacement. */
export function applyIngestedReplacement(
  item: Record<string, unknown>,
  replacement: IngestedReplacement | undefined,
): Record<string, unknown> {
  if (!replacement) return item;
  return {
    ...item,
    imageUrl: replacement.imageUrl,
    title: replacement.title ?? item.title,
    // Dimensions describe the stored (resized) image, not the origin.
    ...(replacement.width ? { width: replacement.width } : {}),
    ...(replacement.height ? { height: replacement.height } : {}),
  };
}

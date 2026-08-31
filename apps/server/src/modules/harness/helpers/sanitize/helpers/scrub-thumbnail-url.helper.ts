/** Blank a broken thumbnail URL in place. */
export function scrubThumbnailUrl(
  item: Record<string, unknown>,
  brokenImageUrls?: Set<string>,
): Record<string, unknown> {
  const thumbnailUrl = item.thumbnailUrl;
  if (typeof thumbnailUrl !== 'string' || !thumbnailUrl) return item;
  return brokenImageUrls?.has(thumbnailUrl)
    ? { ...item, thumbnailUrl: '' }
    : item;
}

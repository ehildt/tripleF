/** Project a media item into the result shape. */
export function mapMediaToResult(item: { url: string; title?: string }) {
  return { url: item.url, title: item.title ?? '' };
}

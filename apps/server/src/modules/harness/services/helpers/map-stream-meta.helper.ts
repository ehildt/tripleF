/** Project a gallery image into the stream meta shape. */
export function mapStreamMeta(item: {
  imageUrl: string;
  title?: string;
  source?: string;
}) {
  return {
    name: item.title,
    hash: item.imageUrl.split('/').pop() ?? '',
    source: item.source,
    variant: 'original' as const,
  };
}

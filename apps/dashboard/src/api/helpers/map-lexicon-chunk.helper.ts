/** Normalize a lexicon chunk into the record shape. */
export function mapLexiconChunk(item: {
  id?: string;
  content?: unknown;
  url?: unknown;
  domain?: string;
  title?: string;
  fetchedAt?: string;
  contentHash?: string;
  chunkIndex?: number;
  chunkCount?: number;
  partitionScope?: string;
}) {
  return {
    id: item.id ?? '',
    content: item.content as string,
    url: item.url as string,
    domain: item.domain ?? '',
    title: item.title,
    fetchedAt: item.fetchedAt ?? '',
    contentHash: item.contentHash ?? '',
    chunkIndex: item.chunkIndex ?? 0,
    chunkCount: item.chunkCount ?? 0,
    partitionScope: item.partitionScope ?? '',
  };
}

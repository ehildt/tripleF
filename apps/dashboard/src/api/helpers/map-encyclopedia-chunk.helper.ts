/** Normalize a encyclopedia chunk into the record shape. */
export function mapEncyclopediaChunk(item: {
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
  category?: string;
  community?: string;
  clusterId?: string;
  topic?: string;
  mimeType?: string;
  sizeBytes?: number;
  originalHash?: string;
  isConsolidated?: boolean;
  isLinked?: boolean;
  isReflected?: boolean;
  isFriction?: boolean;
  superseded?: boolean;
  supersededBy?: string;
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
    category: item.category,
    community: item.community,
    clusterId: item.clusterId,
    topic: item.topic,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    originalHash: item.originalHash,
    isConsolidated: item.isConsolidated,
    isLinked: item.isLinked,
    isReflected: item.isReflected,
    isFriction: item.isFriction,
    superseded: item.superseded,
    supersededBy: item.supersededBy,
  };
}

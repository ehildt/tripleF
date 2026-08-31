import type { EncyclopediaSourceDocument } from '@triplef/agent/schemas';

import { deterministicPointId } from '../../../qdrant/helpers/deterministic-point-id.helper.js';

/** Assemble one encyclopedia chunk point from a document chunk. */
export function mapContentToChunk(
  content: string,
  index: number,
  vectors: number[][],
  doc: EncyclopediaSourceDocument,
  domain: string,
  fetchedAt: string,
  contentHash: string,
  chunkCount: number,
  partitionScope: string,
) {
  return {
    id: deterministicPointId(`${doc.url}|${contentHash}|${index}`),
    vector: vectors[index],
    content,
    url: doc.url,
    domain,
    title: doc.title,
    fetchedAt,
    contentHash,
    chunkIndex: index,
    chunkCount,
    partitionScope,
    sourceType: 'content' as const,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    originalHash: doc.originalHash,
  };
}

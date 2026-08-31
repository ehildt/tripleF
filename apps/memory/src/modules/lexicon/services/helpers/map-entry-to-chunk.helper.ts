import { deterministicPointId } from '../../../qdrant/helpers/deterministic-point-id.helper.js';

/** Assemble one lexicon snippet point from a search result. */
export function mapEntryToChunk(
  entry: {
    url: string;
    title?: string;
    snippet: string;
    contentHash: string;
    domain: string;
  },
  index: number,
  vectors: number[][],
  fetchedAt: string,
  partitionScope: string,
) {
  return {
    id: deterministicPointId(`${entry.url}|${entry.contentHash}`),
    vector: vectors[index],
    content: entry.snippet,
    url: entry.url,
    domain: entry.domain,
    title: entry.title,
    fetchedAt,
    contentHash: entry.contentHash,
    chunkIndex: 0,
    chunkCount: 1,
    partitionScope,
    sourceType: 'result' as const,
  };
}

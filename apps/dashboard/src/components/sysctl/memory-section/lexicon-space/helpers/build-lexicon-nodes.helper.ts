import type { LexiconChunkRecord } from '@/api/memory.api';

import { truncateText } from '../../memory-constellation/helpers/truncate-text.helper';
import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

/** Cluster key for chunks whose domain is missing. */
const UNKNOWN_DOMAIN = 'unknown';

/** Tooltip capture length — a short verbatim excerpt, not the full chunk. */
const SUMMARY_CHARS = 140;

/**
 * Map stored lexicon chunks to constellation dots: the source domain is the
 * cluster key and the dot label, the url + domain drive the co-occurrence
 * links, and the fetch timestamp drives the temporal chain.
 */
export function buildLexiconNodes(
  chunks: readonly LexiconChunkRecord[],
): ConstellationNode[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    label: chunk.domain || UNKNOWN_DOMAIN,
    clusterKey: chunk.domain || UNKNOWN_DOMAIN,
    text: chunk.content,
    summary: truncateText(chunk.content, SUMMARY_CHARS),
    timestamp: chunk.fetchedAt,
    keys: [chunk.domain, chunk.url].filter(Boolean),
    meta: [
      ...(chunk.title ? [{ label: 'title', value: chunk.title }] : []),
      { label: 'url', value: chunk.url },
      { label: 'chunk', value: `${chunk.chunkIndex + 1}/${chunk.chunkCount}` },
    ],
  }));
}

import type { LexiconChunkRecord } from '@/api/memory.api';

import { truncateText } from '../../memory-constellation/helpers/truncate-text.helper';
import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

const UNKNOWN_DOMAIN = 'unknown';
const SUMMARY_CHARS = 140;

/** Map one lexicon chunk to a constellation node. */
export function mapChunkToNode(chunk: LexiconChunkRecord): ConstellationNode {
  return {
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
  };
}

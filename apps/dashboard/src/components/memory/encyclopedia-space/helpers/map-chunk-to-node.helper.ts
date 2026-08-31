import type { EncyclopediaChunkRecord } from '@/api/memory.api';
import { formatFileSize } from '@/helpers/format-file-size.helper';

import { truncateText } from '../../memory-constellation/helpers/truncate-text.helper';
import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

const UNKNOWN_DOMAIN = 'unknown';
const SUMMARY_CHARS = 140;

/** Map one encyclopedia chunk to a constellation node. */
export function mapChunkToNode(
  chunk: EncyclopediaChunkRecord,
): ConstellationNode {
  const topic = chunk.topic?.trim() || chunk.domain || UNKNOWN_DOMAIN;
  return {
    id: chunk.id,
    label: topic,
    topicKey: topic,
    clusterKey: chunk.clusterId?.trim() || chunk.category?.trim() || undefined,
    text: chunk.content,
    summary: truncateText(chunk.content, SUMMARY_CHARS),
    timestamp: chunk.fetchedAt,
    // Provenance fields feed the hub dots' leaf rollup (how many sources …).
    domain: chunk.domain || undefined,
    url: chunk.url || undefined,
    keys: [chunk.category, chunk.topic, chunk.domain, chunk.url].filter(
      (key): key is string => Boolean(key),
    ),
    meta: [
      ...(chunk.title ? [{ label: 'title', value: chunk.title }] : []),
      ...(chunk.domain ? [{ label: 'domain', value: chunk.domain }] : []),
      { label: 'url', value: chunk.url },
      { label: 'chunk', value: `${chunk.chunkIndex + 1}/${chunk.chunkCount}` },
      ...(chunk.mimeType ? [{ label: 'type', value: chunk.mimeType }] : []),
      ...(chunk.sizeBytes !== undefined
        ? [{ label: 'size', value: formatFileSize(chunk.sizeBytes) }]
        : []),
    ],
    isConsolidated: chunk.isConsolidated,
    isReflected: chunk.isReflected,
    isFriction: chunk.isFriction,
    superseded: chunk.superseded,
  };
}

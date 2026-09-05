import { getApiUrl } from '@/api/api-url';
import type { EncyclopediaChunkRecord } from '@/api/memory.api';
import { formatFileSize } from '@/helpers/format-file-size.helper';

import { truncateText } from '../../memory-constellation/helpers/truncate-text.helper';
import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

const UNKNOWN_DOMAIN = 'unknown';
const SUMMARY_CHARS = 140;

/**
 * Map one encyclopedia chunk to a constellation node. Uploaded documents
 * (originalHash) fall back to the file name for the label/topic until the
 * classify job labels them — an unclassified document becomes one blob named
 * after the file instead of joining the shared "unknown" blob — and carry a
 * download link to the stored original.
 */
export function mapChunkToNode(
  chunk: EncyclopediaChunkRecord,
): ConstellationNode {
  const isUploadedDocument = Boolean(chunk.originalHash);
  const topic =
    chunk.topic?.trim() ||
    (isUploadedDocument ? chunk.title?.trim() : '') ||
    chunk.domain ||
    UNKNOWN_DOMAIN;
  return {
    id: chunk.id,
    label: topic,
    topicKey: topic,
    clusterKey: chunk.clusterId?.trim() || chunk.category?.trim() || undefined,
    communityKey: chunk.community?.trim() || undefined,
    text: chunk.content,
    summary: truncateText(chunk.content, SUMMARY_CHARS),
    timestamp: chunk.fetchedAt,
    // Provenance fields feed the hub dots' leaf rollup (how many sources …).
    domain: chunk.domain || undefined,
    url: chunk.url || undefined,
    downloadUrl:
      isUploadedDocument && chunk.url ? getApiUrl(chunk.url) : undefined,
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

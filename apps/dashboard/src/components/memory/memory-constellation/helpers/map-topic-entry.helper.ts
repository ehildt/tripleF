import type { ConstellationTopic } from '../MemoryConstellation.types';

/** Categorical palette for topic blobs (stable by topic order). */
const TOPIC_PALETTE = [
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#14b8a6',
];

/** Build one topic blob from a key/member pair. */
export function mapTopicEntry(
  [key, memberIds]: [string, string[]],
  index: number,
): ConstellationTopic {
  return {
    key,
    label: key,
    color: TOPIC_PALETTE[index % TOPIC_PALETTE.length],
    memberIds,
  };
}

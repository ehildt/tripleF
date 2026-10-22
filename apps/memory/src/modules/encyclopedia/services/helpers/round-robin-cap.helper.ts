import type { EncyclopediaSelectedChunk } from '@triplef/agent/schemas';

/**
 * Keep at most `maxChunks` chunks, drawing round-robin from per-document
 * groups (keyed by url/title) so every source contributes before any source
 * contributes twice.
 */
export function roundRobinCap(
  chunks: EncyclopediaSelectedChunk[],
  maxChunks: number,
): EncyclopediaSelectedChunk[] {
  const groups: EncyclopediaSelectedChunk[][] = [];
  const groupByKey = new Map<string, EncyclopediaSelectedChunk[]>();
  for (const chunk of chunks) {
    const key = chunk.url ?? chunk.title ?? '';
    let group = groupByKey.get(key);
    if (!group) {
      group = [];
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.push(chunk);
  }

  const capped: EncyclopediaSelectedChunk[] = [];
  let cursor = 0;
  while (
    capped.length < maxChunks &&
    groups.some((group) => group.length > 0)
  ) {
    const group = groups[cursor % groups.length];
    const chunk = group.shift();
    if (chunk) capped.push(chunk);
    cursor++;
  }
  return capped;
}

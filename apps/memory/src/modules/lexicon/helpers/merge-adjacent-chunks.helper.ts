import { TextToLines } from '@triplef/helpers/text-to-lines';

/** One chunk to merge — carries its document position for adjacency. */
export interface AdjacentChunk {
  url: string;
  title?: string;
  chunkIndex: number;
  content: string;
  score: number;
}

/** One contiguous passage merged from adjacent chunks of one document. */
interface MergedPassage {
  url: string;
  title?: string;
  content: string;
  score: number;
}

/**
 * Merge neighbor-expanded chunks into contiguous passages per document:
 * group by url, sort by chunk index, split on gaps, and strip the sentence
 * overlap between adjacent chunks (chunk i+1 starts with the last
 * `overlapSentences` sentences of chunk i). Each passage's score is the best
 * score of its chunks — the ordering key for the probe result.
 */
export function mergeAdjacentChunks(
  chunks: AdjacentChunk[],
  overlapSentences: number,
): MergedPassage[] {
  const groups = new Map<string, AdjacentChunk[]>();
  for (const chunk of chunks) {
    const group = groups.get(chunk.url) ?? [];
    group.push(chunk);
    groups.set(chunk.url, group);
  }

  const passages: MergedPassage[] = [];
  for (const [url, group] of groups) {
    const sorted = [...group].sort((a, b) => a.chunkIndex - b.chunkIndex);
    const title = sorted[0]?.title;
    for (const run of splitRuns(sorted)) {
      const content = run
        .map((chunk, index) =>
          index === 0
            ? chunk.content
            : stripOverlap(chunk.content, overlapSentences),
        )
        .join(' ');
      passages.push({
        url,
        title,
        content,
        score: Math.max(...run.map((chunk) => chunk.score)),
      });
    }
  }
  return passages;
}

/** Split a chunk-index-sorted list into runs of consecutive indices. */
function splitRuns(sorted: AdjacentChunk[]): AdjacentChunk[][] {
  const runs: AdjacentChunk[][] = [];
  let current: AdjacentChunk[] = [];
  for (const chunk of sorted) {
    const last = current[current.length - 1];
    if (last && chunk.chunkIndex !== last.chunkIndex + 1) {
      runs.push(current);
      current = [];
    }
    current.push(chunk);
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

/** Drop the leading overlap sentences (they duplicate the previous chunk's tail). */
function stripOverlap(content: string, overlapSentences: number): string {
  if (overlapSentences <= 0) return content;
  const sentences = new TextToLines(content).build();
  if (sentences.length <= overlapSentences) return content;
  return sentences.slice(overlapSentences).join(' ');
}

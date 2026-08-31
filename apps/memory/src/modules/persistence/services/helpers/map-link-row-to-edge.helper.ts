import type { MemoryLinkKind } from '../memory-link.repository.js';

/** Project a link row into the edge shape. */
export function mapLinkRowToEdge(row: {
  source: string;
  target: string;
  score: number;
  kind: string;
}) {
  return {
    source: row.source,
    target: row.target,
    score: row.score,
    kind: row.kind as MemoryLinkKind,
  };
}

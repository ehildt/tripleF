import type { MemoryLinkRecord } from '@/api/memory.api';

/** Project a memory link into the lexicon edge shape. */
export function mapLinkToLexiconEdge(link: MemoryLinkRecord) {
  return {
    source: link.source,
    target: link.target,
    type: 'semantic' as const,
    score: link.score,
  };
}

import type { MemoryLinkRecord } from '@/api/memory.api';

/** Project a memory link into the encyclopedia edge shape. */
export function mapLinkToEncyclopediaEdge(link: MemoryLinkRecord) {
  return {
    source: link.source,
    target: link.target,
    type: 'semantic' as const,
    score: link.score,
  };
}

import type { MemoryLinkRecord } from '@/api/memory.api';

/** Project a memory link into the constellation edge shape. */
export function mapLinkToEdge(link: MemoryLinkRecord) {
  return {
    source: link.source,
    target: link.target,
    type: 'semantic' as const,
    score: link.score,
    suggested: link.kind === 'topical' ? true : undefined,
  };
}

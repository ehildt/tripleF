import type { MemoryClusterRecord } from '@/api/memory.api';

export interface SynopsisTreeNodeProps {
  /** The cluster synopsis this row renders (title, level, summary, count). */
  node: MemoryClusterRecord;
}

import type { MemoryClusterRecord } from '@/api/memory.api';

export interface SynopsisTreeNodeHeadProps {
  /** The cluster synopsis whose title, level badge, and member count the head presents. */
  node: MemoryClusterRecord;
  /** Whether the row's summary and children are currently revealed. */
  expanded: boolean;
}

export interface SynopsisTreeNodeHeadEmits {
  /** The user clicked the head to expand or collapse the row. */
  (e: 'toggle'): void;
}

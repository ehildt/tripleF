import type { KeyFinding } from '@/types/assistant-response-data.model';

/** Props for `ProductSpecsList`, the label/value spec table. */
export interface ProductSpecsListProps {
  /** Label/value rows, each split on a delimiter for display. */
  items: readonly KeyFinding[];
}

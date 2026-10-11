import type {
  KeyFinding,
  StatHighlight,
} from '@/types/harness-response-data.model';

/** Props for `ProductStatHighlights`, the big-number stat row plus spec table. */
export interface ProductStatHighlightsProps {
  /** The big-number stats rendered across the top row. */
  stats?: readonly StatHighlight[];
  /** The full label/value spec table below the stats. */
  specItems?: readonly KeyFinding[];
}

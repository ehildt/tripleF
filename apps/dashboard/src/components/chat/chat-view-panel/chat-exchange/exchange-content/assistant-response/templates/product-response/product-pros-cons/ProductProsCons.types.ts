import type { KeyFinding } from '@/types/harness-response-data.model';

/** Props for `ProductProsCons`, the two-column strengths/caveats panel. */
export interface ProductProsConsProps {
  /** Strengths listed in the left column. */
  pros?: readonly KeyFinding[];
  /** Caveats listed in the right column. */
  cons?: readonly KeyFinding[];
}

import type { KeyFinding } from '@/types/harness-response-data.model';

import type { FundamentalEntry } from '../../stockmarket-response/helpers/build-fundamental-entries.helper';

/** Props for `StockmarketItemPanels`, the fundamentals + key findings row. */
export interface StockmarketItemPanelsProps {
  /** Fundamental entries shown as stat cards. */
  fundamentals: FundamentalEntry[];
  /** Key findings listed alongside the fundamentals. */
  keyPoints?: KeyFinding[];
}

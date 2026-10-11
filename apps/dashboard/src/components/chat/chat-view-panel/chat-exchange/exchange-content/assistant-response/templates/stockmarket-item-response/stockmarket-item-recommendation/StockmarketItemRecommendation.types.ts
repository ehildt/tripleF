/** Props for `StockmarketItemRecommendation`, the verdict callout. */
export interface StockmarketItemRecommendationProps {
  /** The verdict, e.g. Buy/Hold/Sell. */
  recommendation: string;
  /** Optional reasoning behind the verdict. */
  reasoning?: string;
}
